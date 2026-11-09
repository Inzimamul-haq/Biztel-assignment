"""Embedding helpers used by ingestion and question answering."""

from app.shared.ai.gemini_client import embed_texts

_BATCH_SIZE = 32
DOCUMENT_TASK = "RETRIEVAL_DOCUMENT"
QUERY_TASK = "RETRIEVAL_QUERY"


def embed_text(text: str, *, task_type: str = QUERY_TASK) -> list[float]:
    """Embed one string."""
    vectors = embed_batch([text], task_type=task_type)
    return vectors[0]


def embed_batch(texts: list[str], *, task_type: str = DOCUMENT_TASK) -> list[list[float]]:
    """Embed many strings in batches. Document chunks use the document task type."""
    vectors: list[list[float]] = []
    for start in range(0, len(texts), _BATCH_SIZE):
        batch = texts[start : start + _BATCH_SIZE]
        vectors.extend(embed_texts(batch, task_type))
    return vectors
