"""Embed the search text and return the nearest active-document chunks."""

import logging

from sqlalchemy.orm import Session

from app.core.config import settings
from app.features.documents.repository import search_chunks
from app.features.documents.schemas import RetrievedChunk

logger = logging.getLogger(__name__)


def retrieve(
    db: Session,
    query_embedding: list[float],
    document_types: list[str] | None,
) -> list[RetrievedChunk]:
    """Search active chunks. If a type filter is weak, search once more without it."""
    types = document_types or None
    filtered = search_chunks(db, query_embedding, types, settings.top_k)
    if not types:
        return filtered
    best = filtered[0].similarity if filtered else 0.0
    if not filtered or best < settings.min_similarity:
        logger.info("retrieval retry without document_type filter best_similarity=%.3f", best)
        return search_chunks(db, query_embedding, None, settings.top_k)
    return filtered
