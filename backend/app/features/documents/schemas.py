"""Records passed between ingestion, storage, and retrieval."""

import uuid
from dataclasses import dataclass


@dataclass
class ChunkRecord:
    chunk_index: int
    page_number: int
    section_title: str | None
    content: str
    token_count: int
    embedding: list[float]


@dataclass
class RetrievedChunk:
    id: uuid.UUID
    content: str
    page_number: int
    section_title: str | None
    document_number: str
    title: str
    revision: str
    document_type: str
    similarity: float
