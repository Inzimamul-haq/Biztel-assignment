"""Verify retrieved chunks meet the minimum similarity threshold before calling the answer model."""

from dataclasses import dataclass

from app.core.config import settings
from app.features.chat.enums import ResponseStatus
from app.features.documents.schemas import RetrievedChunk


@dataclass
class EvidenceDecision:
    is_sufficient: bool
    status: ResponseStatus | None
    best_similarity: float


def check_evidence(
    chunks: list[RetrievedChunk],
    *,
    min_similarity: float | None = None,
) -> EvidenceDecision:
    """Return whether retrieved chunks are strong enough to send to the answer generator."""
    threshold = settings.min_similarity if min_similarity is None else min_similarity
    if not chunks:
        return EvidenceDecision(
            is_sufficient=False,
            status=ResponseStatus.NOT_FOUND,
            best_similarity=0.0,
        )
    best = max(chunk.similarity for chunk in chunks)
    if best < threshold:
        return EvidenceDecision(
            is_sufficient=False,
            status=ResponseStatus.INSUFFICIENT_EVIDENCE,
            best_similarity=best,
        )
    return EvidenceDecision(
        is_sufficient=True,
        status=None,
        best_similarity=best,
    )
