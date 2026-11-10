"""Orchestrate the full RAG pipeline: classify -> embed -> retrieve -> check evidence -> generate."""

import logging
import time
import uuid

from fastapi import status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import AppError
from app.features.chat.answer_generator import (
    INSUFFICIENT_EVIDENCE_MESSAGE,
    generate_grounded_answer,
    get_insufficient_evidence_message,
)
from app.features.chat.classifier import classify_question
from app.features.chat.enums import ResponseStatus, Scope
from app.features.chat.evidence import check_evidence
from app.features.chat.guardrails import BLOCKED_MESSAGE, looks_like_prompt_injection, sanitize_question
from app.features.chat.retrieval import retrieve
from app.features.chat.schemas import ChatPipelineResult, ChatRequest, ChatResponse, SourceRef
from app.features.conversations import repository as conversation_repo
from app.features.conversations.service import get_owned_conversation
from app.features.documents.schemas import RetrievedChunk
from app.shared.ai.embedding_service import QUERY_TASK, embed_text

logger = logging.getLogger(__name__)

OUT_OF_SCOPE_MESSAGE = (
    "That's outside what I can help with. I answer questions about the plant's lockout/tagout "
    "safety procedure, incoming material inspection, and TX-200 CNC preventive maintenance. "
    "Try asking something like: \"What should I do before replacing the hydraulic hose on the TX-200?\""
)
GENERAL_FALLBACK_MESSAGE = (
    "Hi! I'm **Shop-Floor Copilot**, your assistant for the plant's active SOPs and machine manuals. "
    "Ask me about lockout/tagout, incoming material inspection, or TX-200 CNC maintenance, "
    "and I'll answer with the exact document, revision and page."
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
    sources.sort(key=lambda s: (s.document_number, s.page_number))
    return sources


def get_out_of_scope_message(language: str = "en-IN") -> str:
    lang = language.lower()
    if lang.startswith("ta"):
        return (
            "அது எனது எல்லைக்கு அப்பாற்பட்டது. லாக்அவுட்/டேக்அவுட் பாதுகாப்பு நடைமுறை (SAF-SOP-003), "
            "உள்வரும் பொருட்கள் ஆய்வு (QC-SOP-014), மற்றும் TX-200 CNC பராமரிப்பு கையேடு பற்றிய கேள்விகளுக்கு மட்டுமே "
            "நான் பதிலளிப்பேன். உதாரணமாக: \"TX-200 இயந்திரத்தில் ஹைட்ராலிக் ஹோஸை மாற்றுவதற்கு முன் என்ன செய்ய வேண்டும்?\" என்று கேட்கலாம்."
        )
    if lang.startswith("hi"):
        return (
            "यह मेरे कार्यक्षेत्र से बाहर है। मैं केवल प्लांट की लॉकआउट/टैगआउट सुरक्षा प्रक्रिया (SAF-SOP-003), "
            "आवक सामग्री निरीक्षण (QC-SOP-014), और TX-200 CNC निवारक रखरखाव नियमावली से संबंधित प्रश्नों का उत्तर देता हूँ। "
            "उदाहरण के लिए: \"TX-200 मशीन पर हाइड्रोलिक नली बदलने से पहले मुझे क्या करना चाहिए?\" पूछ सकते हैं।"
        )
    return OUT_OF_SCOPE_MESSAGE


def get_general_fallback_message(language: str = "en-IN") -> str:
    lang = language.lower()
    if lang.startswith("ta"):
        return (
            "வணக்கம்! நான் உங்கள் **Shop-Floor Copilot** (ஷாப்-ப்ளோர் வழிகாட்டி). "
            "ஆலை பாதுகாப்பு நடைமுறைகள் (SAF-SOP-003), உள்வரும் ஆய்வு (QC-SOP-014) மற்றும் TX-200 CNC பராமரிப்பு பற்றிய "
            "கேள்விகளுக்கு துல்லியமான ஆவண பக்கக் குறிப்புகளுடன் பதிலளிக்கிறேன்."
        )
    if lang.startswith("hi"):
        return (
            "नमस्ते! मैं आपका **Shop-Floor Copilot** हूँ। "
            "मैं प्लांट की लॉकआउट/टैगआउट (SAF-SOP-003), सामग्री निरीक्षण (QC-SOP-014) और TX-200 CNC रखरखाव नियमावली "
            "से संबंधित प्रश्नों के सटीक उत्तर दस्तावेज़ संदर्भों के साथ देता हूँ।"
        )
    return GENERAL_FALLBACK_MESSAGE


def run_rag_pipeline(db: Session, question: str, language: str = "en-IN") -> ChatPipelineResult:
    """Run Workflow B (steps 3 to 8) with step-by-step console observability."""
    started = time.perf_counter()
    cleaned_question = sanitize_question(question)
    insufficient_msg = get_insufficient_evidence_message(language)

    logger.info("=" * 72)
    logger.info("[STEP 1/5] QUESTION RECEIVED (%s): %r", language, cleaned_question)

    if looks_like_prompt_injection(cleaned_question):
        logger.warning("[GUARDRAIL] Prompt-injection pattern detected -> blocked before any AI call")
        logger.info("=" * 72)
        return ChatPipelineResult(
            response_status=ResponseStatus.NOT_FOUND,
            answer=BLOCKED_MESSAGE,
            warnings=[],
            sources=[],
        )

    t0 = time.perf_counter()
    classification = classify_question(cleaned_question, language=language)
    classify_ms = (time.perf_counter() - t0) * 1000
    logger.info(
        "[STEP 2/5] CLASSIFIER (%.0fms): scope=%s | doc_types=%s | search_query=%r",
        classify_ms,
        classification.scope.value,
        classification.document_types or "ALL_ACTIVE",
        classification.search_query,
    )

    if classification.scope == Scope.GENERAL:
        logger.info(
            "[STEP 3/5] SKIPPED RETRIEVAL: small talk -> friendly reply (total %.0fms)",
            (time.perf_counter() - started) * 1000,
        )
        logger.info("=" * 72)
        return ChatPipelineResult(
            response_status=ResponseStatus.GENERAL,
            answer=classification.friendly_reply or get_general_fallback_message(language),
            warnings=[],
            sources=[],
        )

    if classification.scope == Scope.OUT_OF_SCOPE:
        latency_ms = (time.perf_counter() - started) * 1000
        logger.info(
            "[STEP 3/5] SKIPPED RETRIEVAL: question is OUT_OF_SCOPE -> status=%s (total %.0fms)",
            ResponseStatus.NOT_FOUND.value,
            latency_ms,
        )
        logger.info("=" * 72)
        return ChatPipelineResult(
            response_status=ResponseStatus.NOT_FOUND,
            answer=get_out_of_scope_message(language),
            warnings=[],
            sources=[],
        )

    try:
        t1 = time.perf_counter()
        query_vector = embed_text(classification.search_query, task_type=QUERY_TASK)
        chunks = retrieve(db, query_vector, classification.document_types or None)
        retrieve_ms = (time.perf_counter() - t1) * 1000
    except Exception as exc:
        latency_ms = (time.perf_counter() - started) * 1000
        logger.error(
            "[STEP 3/5] RETRIEVAL FAILED (%.0fms): error=%s",
            latency_ms,
            type(exc).__name__,
        )
        logger.info("=" * 72)
        return ChatPipelineResult(
            response_status=ResponseStatus.ERROR,
            answer=ERROR_RETRY_MESSAGE,
            warnings=[],
            sources=[],
        )

    chunk_summary = [
        f"{c.document_number} Rev{c.revision} p.{c.page_number} ({c.section_title or 'General'}) sim={c.similarity:.3f}"
        for c in chunks
    ]
    logger.info(
        "[STEP 3/5] RETRIEVAL (%.0fms): top_%d chunks=%s",
        retrieve_ms,
        len(chunks),
        chunk_summary,
    )

    decision = check_evidence(chunks)
    logger.info(
        "[STEP 4/5] EVIDENCE CHECK: best_similarity=%.3f vs min_similarity=%.2f -> passed=%s",
        decision.best_similarity,
        settings.min_similarity,
        decision.is_sufficient,
    )

    if not decision.is_sufficient:
        status_val = decision.status or ResponseStatus.INSUFFICIENT_EVIDENCE
        latency_ms = (time.perf_counter() - started) * 1000
        logger.info(
            "[STEP 5/5] STOPPED BEFORE AI ANSWER: status=%s (total %.0fms)",
            status_val.value,
            latency_ms,
        )
        logger.info("=" * 72)
        return ChatPipelineResult(
            response_status=status_val,
            answer=insufficient_msg,
            warnings=[],
            sources=[],
        )

    try:
        t2 = time.perf_counter()
        generated = generate_grounded_answer(cleaned_question, chunks, language=language)
        answer_ms = (time.perf_counter() - t2) * 1000
    except Exception as exc:
        latency_ms = (time.perf_counter() - started) * 1000
        logger.error(
            "[STEP 5/5] ANSWER GENERATOR FAILED (%.0fms): error=%s",
            latency_ms,
            type(exc).__name__,
        )
        logger.info("=" * 72)
        return ChatPipelineResult(
            response_status=ResponseStatus.ERROR,
            answer=ERROR_RETRY_MESSAGE,
            warnings=[],
            sources=[],
        )

    if generated.response_status != ResponseStatus.ANSWERED:
        latency_ms = (time.perf_counter() - started) * 1000
        logger.info(
            "[STEP 5/5] ANSWER GENERATOR (%.0fms): model reported status=%s (total %.0fms)",
            answer_ms,
            generated.response_status.value,
            latency_ms,
        )
        logger.info("=" * 72)
        return ChatPipelineResult(
            response_status=generated.response_status,
            answer=insufficient_msg,
            warnings=[],
            sources=[],
        )

    sources = build_sources(chunks, generated.used_chunk_ids)
    source_labels = [f"{s.document_number} Rev{s.revision} p.{s.page_number}" for s in sources]
    latency_ms = (time.perf_counter() - started) * 1000
    logger.info(
        "[STEP 5/5] ANSWER GENERATED (%.0fms): status=ANSWERED | warnings=%d | sources=%s | total=%.0fms",
        answer_ms,
        len(generated.warnings),
        source_labels,
        latency_ms,
    )
    logger.info("=" * 72)
    return ChatPipelineResult(
        response_status=ResponseStatus.ANSWERED,
        answer=generated.answer,
        warnings=generated.warnings,
        sources=sources,
    )


def handle_chat_request(
    db: Session,
    *,
    user_id: uuid.UUID,
    payload: ChatRequest,
) -> ChatResponse:
    """Validate question, create/verify conversation, save USER message, run RAG, save ASSISTANT message."""
    cleaned = sanitize_question(payload.question)
    if not cleaned:
        raise AppError(
            detail="Question cannot be empty.",
            code="EMPTY_QUESTION",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    if len(cleaned) > settings.max_question_chars:
        raise AppError(
            detail=f"Question must be at most {settings.max_question_chars} characters.",
            code="QUESTION_TOO_LONG",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    if payload.conversation_id is not None:
        conversation = get_owned_conversation(db, payload.conversation_id, user_id)
    else:
        conversation = conversation_repo.create_conversation(
            db,
            user_id=user_id,
            title=cleaned,
        )

    conversation_repo.add_message(
        db,
        conversation=conversation,
        role="USER",
        content=cleaned,
    )
    db.commit()

    try:
        result = run_rag_pipeline(db, cleaned, language=payload.language)
    except Exception as exc:
        logger.exception("Unexpected failure in RAG pipeline: %s", type(exc).__name__)
        result = ChatPipelineResult(
            response_status=ResponseStatus.ERROR,
            answer=ERROR_RETRY_MESSAGE,
            warnings=[],
            sources=[],
        )

    serialized_sources = [source.model_dump() for source in result.sources]
    assistant_msg = conversation_repo.add_message(
        db,
        conversation=conversation,
        role="ASSISTANT",
        content=result.answer,
        response_status=result.response_status.value,
        warnings=result.warnings,
        sources=serialized_sources,
    )
    db.commit()
    db.refresh(assistant_msg)

    return ChatResponse(
        conversation_id=conversation.id,
        message_id=assistant_msg.id,
        response_status=result.response_status,
        answer=result.answer,
        warnings=result.warnings,
        sources=result.sources,
    )
