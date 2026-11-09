"""Orchestrate the full RAG pipeline: classify -> embed -> retrieve -> check evidence -> generate."""

import logging
import time

from sqlalchemy.orm import Session

from app.features.chat.answer_generator import (
    INSUFFICIENT_EVIDENCE_MESSAGE,
    generate_grounded_answer,
)
from app.features.chat.classifier import classify_question
from app.features.chat.enums import ResponseStatus, Scope
from app.features.chat.evidence import check_evidence
from app.features.chat.retrieval import retrieve
from app.features.chat.schemas import ChatPipelineResult, SourceRef
from app.features.documents.schemas import RetrievedChunk
from app.shared.ai.embedding_service import QUERY_TASK, embed_text

logger = logging.getLogger(__name__)

OUT_OF_SCOPE_MESSAGE = (
    "I can only answer questions about plant SOPs, quality inspections, safety procedures, "
    "and machine maintenance covered in the shop-floor documents."
)
ERROR_RETRY_MESSAGE = (
    "The AI service is temporarily unavailable. Please try asking your question again in a moment."
)


def build_sources(
    chunks: list[RetrievedChunk],
    used_chunk_ids: list[str],
) -> list[SourceRef]:
    """Build deduplicated SourceRef items strictly from retrieved chunks that the model cited."""
    chunk_by_id = {str(chunk.id): chunk for chunk in chunks}
    selected: list[RetrievedChunk] = []
    for cid in used_chunk_ids:
        chunk = chunk_by_id.get(cid)
        if chunk is not None:
            selected.append(chunk)

    # If the model answered from the supplied chunks but omitted IDs, fall back to the top retrieved chunk
    if not selected and chunks:
        selected = [chunks[0]]

    seen: set[tuple[str, str, int, str | None]] = set()
    sources: list[SourceRef] = []
    for chunk in selected:
        key = (chunk.document_number, chunk.revision, chunk.page_number, chunk.section_title)
        if key in seen:
            continue
        seen.add(key)
        sources.append(
            SourceRef(
                document_number=chunk.document_number,
                title=chunk.title,
                revision=chunk.revision,
                page_number=chunk.page_number,
                section_title=chunk.section_title,
            )
        )
    return sources


def run_rag_pipeline(db: Session, question: str) -> ChatPipelineResult:
    """Run Workflow B (steps 3 to 8) and log latency, scope, chunks, and status."""
    started = time.perf_counter()
    cleaned_question = question.strip()

    classification = classify_question(cleaned_question)
    if classification.scope == Scope.OUT_OF_SCOPE:
        latency_ms = (time.perf_counter() - started) * 1000
        logger.info(
            "chat.pipeline question=%r scope=%s chunks=[] status=%s latency_ms=%.0f",
            cleaned_question,
            classification.scope.value,
            ResponseStatus.NOT_FOUND.value,
            latency_ms,
        )
        return ChatPipelineResult(
            response_status=ResponseStatus.NOT_FOUND,
            answer=OUT_OF_SCOPE_MESSAGE,
            warnings=[],
            sources=[],
        )

    try:
        query_vector = embed_text(classification.search_query, task_type=QUERY_TASK)
        chunks = retrieve(db, query_vector, classification.document_types or None)
    except Exception as exc:
        latency_ms = (time.perf_counter() - started) * 1000
        logger.error(
            "chat.pipeline retrieval/embedding failed question=%r scope=%s error=%s latency_ms=%.0f",
            cleaned_question,
            classification.scope.value,
            type(exc).__name__,
            latency_ms,
        )
        return ChatPipelineResult(
            response_status=ResponseStatus.ERROR,
            answer=ERROR_RETRY_MESSAGE,
            warnings=[],
            sources=[],
        )

    chunk_log = [(str(c.id), round(c.similarity, 3)) for c in chunks]
    decision = check_evidence(chunks)
    if not decision.is_sufficient:
        status = decision.status or ResponseStatus.INSUFFICIENT_EVIDENCE
        latency_ms = (time.perf_counter() - started) * 1000
        logger.info(
            "chat.pipeline question=%r scope=%s chunks=%s status=%s latency_ms=%.0f",
            cleaned_question,
            classification.scope.value,
            chunk_log,
            status.value,
            latency_ms,
        )
        return ChatPipelineResult(
            response_status=status,
            answer=INSUFFICIENT_EVIDENCE_MESSAGE,
            warnings=[],
            sources=[],
        )

    try:
        generated = generate_grounded_answer(cleaned_question, chunks)
    except Exception as exc:
        latency_ms = (time.perf_counter() - started) * 1000
        logger.error(
            "chat.pipeline answer generation failed question=%r scope=%s chunks=%s error=%s latency_ms=%.0f",
            cleaned_question,
            classification.scope.value,
            chunk_log,
            type(exc).__name__,
            latency_ms,
        )
        return ChatPipelineResult(
            response_status=ResponseStatus.ERROR,
            answer=ERROR_RETRY_MESSAGE,
            warnings=[],
            sources=[],
        )

    if generated.response_status != ResponseStatus.ANSWERED:
        latency_ms = (time.perf_counter() - started) * 1000
        logger.info(
            "chat.pipeline question=%r scope=%s chunks=%s status=%s latency_ms=%.0f",
            cleaned_question,
            classification.scope.value,
            chunk_log,
            generated.response_status.value,
            latency_ms,
        )
        return ChatPipelineResult(
            response_status=generated.response_status,
            answer=INSUFFICIENT_EVIDENCE_MESSAGE,
            warnings=[],
            sources=[],
        )

    sources = build_sources(chunks, generated.used_chunk_ids)
    latency_ms = (time.perf_counter() - started) * 1000
    logger.info(
        "chat.pipeline question=%r scope=%s chunks=%s status=%s latency_ms=%.0f",
        cleaned_question,
        classification.scope.value,
        chunk_log,
        ResponseStatus.ANSWERED.value,
        latency_ms,
    )
    return ChatPipelineResult(
        response_status=ResponseStatus.ANSWERED,
        answer=generated.answer,
        warnings=generated.warnings,
        sources=sources,
    )
