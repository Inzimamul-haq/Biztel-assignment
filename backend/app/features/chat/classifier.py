"""AI Call 1: Classify the supervisor's question and produce a search query."""

import json
import logging
import re

from pydantic import BaseModel, Field, ValidationError

from app.features.chat.enums import Scope
from app.features.chat.prompts import build_classifier_prompt
from app.features.documents.enums import DocumentType
from app.shared.ai.gemini_client import generate_text

logger = logging.getLogger(__name__)

_ALLOWED_DOC_TYPES = {item.value for item in DocumentType}
_CODE_FENCE = re.compile(r"^```(?:json)?\s*|\s*```$", re.IGNORECASE)


class ClassificationResult(BaseModel):
    scope: Scope
    document_types: list[str] = Field(default_factory=list)
    search_query: str


def _strip_fences(raw: str) -> str:
    return _CODE_FENCE.sub("", raw.strip()).strip()


def classify_question(question: str) -> ClassificationResult:
    """Classify the question with Gemini Flash. Falls back to searching all active docs on any failure."""
    cleaned_question = question.strip()
    try:
        raw = generate_text(build_classifier_prompt(cleaned_question), json_mode=True)
        data = json.loads(_strip_fences(raw))
        parsed = ClassificationResult.model_validate(data)
    except ( json.JSONDecodeError, ValidationError, Exception ) as exc:
        logger.warning("Classifier failed or returned invalid JSON (%s); falling back to all active docs", type(exc).__name__)
        return ClassificationResult(
            scope=Scope.COMBINED,
            document_types=[],
            search_query=cleaned_question,
        )

    valid_types = [t for t in parsed.document_types if t in _ALLOWED_DOC_TYPES]
    search_query = parsed.search_query.strip() or cleaned_question

    if parsed.scope == Scope.OUT_OF_SCOPE:
        return ClassificationResult(
            scope=Scope.OUT_OF_SCOPE,
            document_types=[],
            search_query=search_query,
        )

    return ClassificationResult(
        scope=parsed.scope,
        document_types=valid_types,
        search_query=search_query,
    )
