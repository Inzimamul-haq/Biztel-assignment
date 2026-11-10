"""AI Call 2: Generate a grounded answer with warnings and cited chunk IDs."""

import json
import logging
import re
from typing import Literal

from pydantic import BaseModel, Field, ValidationError

from app.features.chat.enums import ResponseStatus
from app.features.chat.prompts import build_answer_prompt
from app.features.documents.schemas import RetrievedChunk
from app.shared.ai.gemini_client import generate_text

logger = logging.getLogger(__name__)

_CODE_FENCE = re.compile(r"^```(?:json)?\s*|\s*```$", re.IGNORECASE)

INSUFFICIENT_EVIDENCE_MESSAGE = (
    "This is not covered in the available documents. "
    "Please check with your maintenance or safety lead."
)

INSUFFICIENT_EVIDENCE_TAMIL = (
    "இது கிடைக்கக்கூடிய ஆவணங்களில் குறிப்பிடப்படவில்லை. "
    "தயவுசெய்து உங்கள் பராமரிப்பு அல்லது பாதுகாப்பு பொறுப்பாளரிடம் சரிபார்க்கவும்."
)

INSUFFICIENT_EVIDENCE_HINDI = (
    "यह उपलब्ध दस्तावेज़ों में शामिल नहीं है। "
    "कृपया अपने रखरखाव या सुरक्षा प्रभारी से संपर्क करें।"
)


def get_insufficient_evidence_message(language: str = "en-IN") -> str:
    lang = language.lower()
    if lang.startswith("ta"):
        return INSUFFICIENT_EVIDENCE_TAMIL
    if lang.startswith("hi"):
        return INSUFFICIENT_EVIDENCE_HINDI
    return INSUFFICIENT_EVIDENCE_MESSAGE


class ModelAnswerPayload(BaseModel):
    response_status: Literal["ANSWERED", "INSUFFICIENT_EVIDENCE"]
    answer: str
    warnings: list[str] = Field(default_factory=list)
    used_chunk_ids: list[str] = Field(default_factory=list)


class GeneratedAnswer(BaseModel):
    response_status: ResponseStatus
    answer: str
    warnings: list[str]
    used_chunk_ids: list[str]


def _strip_fences(raw: str) -> str:
    return _CODE_FENCE.sub("", raw.strip()).strip()


def format_chunks_for_prompt(chunks: list[RetrievedChunk]) -> str:
    blocks: list[str] = []
    for chunk in chunks:
        section = chunk.section_title or "General"
        header = (
            f"[Chunk ID: {chunk.id}] "
            f"Document: {chunk.document_number} ({chunk.title}) | "
            f"Rev: {chunk.revision} | Page: {chunk.page_number} | Section: {section}"
        )
        blocks.append(f"{header}\n{chunk.content}")
    return "\n\n---\n\n".join(blocks)


def generate_grounded_answer(
    question: str,
    chunks: list[RetrievedChunk],
    language: str = "en-IN",
) -> GeneratedAnswer:
    """Call Gemini Flash with the retrieved chunks and parse the structured JSON response."""
    fallback_msg = get_insufficient_evidence_message(language)
    prompt = build_answer_prompt(question, format_chunks_for_prompt(chunks), language=language)
    raw = generate_text(prompt, json_mode=True)
    try:
        data = json.loads(_strip_fences(raw))
        payload = ModelAnswerPayload.model_validate(data)
    except (json.JSONDecodeError, ValidationError) as exc:
        logger.warning("Answer generator returned invalid JSON (%s)", type(exc).__name__)
        return GeneratedAnswer(
            response_status=ResponseStatus.INSUFFICIENT_EVIDENCE,
            answer=fallback_msg,
            warnings=[],
            used_chunk_ids=[],
        )

    retrieved_ids = {str(chunk.id) for chunk in chunks}
    valid_used_ids = [cid for cid in payload.used_chunk_ids if cid in retrieved_ids]

    if payload.response_status == "INSUFFICIENT_EVIDENCE" or not payload.answer.strip():
        return GeneratedAnswer(
            response_status=ResponseStatus.INSUFFICIENT_EVIDENCE,
            answer=payload.answer.strip() or fallback_msg,
            warnings=[],
            used_chunk_ids=[],
        )

    cleaned_warnings = [w.strip() for w in payload.warnings if w and w.strip()]
    return GeneratedAnswer(
        response_status=ResponseStatus.ANSWERED,
        answer=payload.answer.strip(),
        warnings=cleaned_warnings,
        used_chunk_ids=valid_used_ids,
    )
