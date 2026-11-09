"""Create documents, store embeddings, and search active revisions only."""

import uuid

from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from app.features.documents.enums import DocumentStatus
from app.features.documents.models import Document, DocumentChunk
from app.features.documents.schemas import ChunkRecord, RetrievedChunk


def get_by_number_and_revision(
    db: Session,
    document_number: str,
    revision: str,
) -> Document | None:
    return db.scalar(
        select(Document).where(
            Document.document_number == document_number,
            Document.revision == revision,
        )
    )


def create_document(
    db: Session,
    *,
    document_number: str,
    title: str,
    document_type: str,
    revision: str,
    file_path: str,
) -> Document:
    document = Document(
        document_number=document_number,
        title=title,
        document_type=document_type,
        revision=revision,
        status=DocumentStatus.PROCESSING.value,
        file_path=file_path,
    )
    db.add(document)
    db.flush()
    return document


def save_chunks(db: Session, document_id: uuid.UUID, chunks: list[ChunkRecord]) -> int:
    """Replace any previous chunks for this document, then insert the new set."""
    db.execute(delete(DocumentChunk).where(DocumentChunk.document_id == document_id))
    for chunk in chunks:
        db.add(
            DocumentChunk(
                document_id=document_id,
                chunk_index=chunk.chunk_index,
                page_number=chunk.page_number,
                section_title=chunk.section_title,
                content=chunk.content,
                token_count=chunk.token_count,
                embedding=chunk.embedding,
            )
        )
    db.flush()
    return len(chunks)


def activate(db: Session, document: Document) -> None:
    """Make this revision active and supersede the previous active revision."""
    db.execute(
        update(Document)
        .where(
            Document.document_number == document.document_number,
            Document.id != document.id,
            Document.status == DocumentStatus.ACTIVE.value,
        )
        .values(status=DocumentStatus.SUPERSEDED.value)
    )
    document.status = DocumentStatus.ACTIVE.value
    db.flush()


def mark_failed(db: Session, document: Document) -> None:
    document.status = DocumentStatus.FAILED.value
    db.flush()


def build_search_statement(
    query_embedding: list[float],
    document_types: list[str] | None,
    limit: int,
):
    """Cosine search limited to ACTIVE revisions. Superseded rows are excluded."""
    distance = DocumentChunk.embedding.cosine_distance(query_embedding)
    similarity = (1 - distance).label("similarity")
    statement = (
        select(
            DocumentChunk.id.label("id"),
            DocumentChunk.content.label("content"),
            DocumentChunk.page_number.label("page_number"),
            DocumentChunk.section_title.label("section_title"),
            Document.document_number.label("document_number"),
            Document.title.label("title"),
            Document.revision.label("revision"),
            Document.document_type.label("document_type"),
            similarity,
        )
        .join(Document, Document.id == DocumentChunk.document_id)
        .where(Document.status == DocumentStatus.ACTIVE.value)
        .where(DocumentChunk.embedding.is_not(None))
        .order_by(distance)
        .limit(limit)
    )
    if document_types:
        statement = statement.where(Document.document_type.in_(document_types))
    return statement


def search_chunks(
    db: Session,
    query_embedding: list[float],
    document_types: list[str] | None,
    limit: int,
) -> list[RetrievedChunk]:
    rows = db.execute(build_search_statement(query_embedding, document_types, limit)).all()
    return [
        RetrievedChunk(
            id=row.id,
            content=row.content,
            page_number=row.page_number,
            section_title=row.section_title,
            document_number=row.document_number,
            title=row.title,
            revision=row.revision,
            document_type=row.document_type,
            similarity=float(row.similarity),
        )
        for row in rows
    ]
