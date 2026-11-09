"""Run extract, clean, chunk, embed, and activate for one PDF."""

import logging
import shutil
from dataclasses import dataclass
from pathlib import Path

from sqlalchemy.orm import Session

from app.core.config import settings
from app.features.documents.enums import DocumentStatus
from app.features.documents.repository import (
    activate,
    create_document,
    get_by_number_and_revision,
    mark_failed,
    save_chunks,
)
from app.features.documents.schemas import ChunkRecord
from app.features.ingestion.chunker import chunk_blocks
from app.features.ingestion.manifest import ManifestEntry
from app.features.ingestion.ocr_fallback import blocks_from_transcription, transcribe_page
from app.features.ingestion.pdf_extractor import extract_pdf, render_page_png, replace_page_blocks
from app.features.ingestion.text_cleaner import clean_pages
from app.shared.ai.embedding_service import embed_batch

logger = logging.getLogger(__name__)

_SKIPPED = {DocumentStatus.ACTIVE.value, DocumentStatus.SUPERSEDED.value}


@dataclass
class IngestSummary:
    document_number: str
    revision: str
    status: str
    pages: int
    chunks_created: int
    ocr_pages: list[int]
    detail: str


def process_document(
    db: Session,
    entry: ManifestEntry,
    source_path: Path,
    storage_dir: Path,
) -> IngestSummary:
    """Ingest one manifest entry. Active and superseded revisions are left as they are."""
    existing = get_by_number_and_revision(db, entry.document_number, entry.revision)
    if existing is not None and existing.status in _SKIPPED:
        return IngestSummary(
            document_number=entry.document_number,
            revision=entry.revision,
            status="SKIPPED",
            pages=existing.page_count or 0,
            chunks_created=0,
            ocr_pages=[],
            detail=f"already {existing.status}",
        )
    if not source_path.is_file():
        return IngestSummary(
            document_number=entry.document_number,
            revision=entry.revision,
            status=DocumentStatus.FAILED.value,
            pages=0,
            chunks_created=0,
            ocr_pages=[],
            detail=f"missing file {source_path.name}",
        )

    destination = storage_dir / entry.filename
    destination.parent.mkdir(parents=True, exist_ok=True)
    if source_path.resolve() != destination.resolve():
        shutil.copyfile(source_path, destination)
    relative_path = f"storage/documents/{entry.filename}"

    if existing is None:
        document = create_document(
            db,
            document_number=entry.document_number,
            title=entry.title,
            document_type=entry.document_type,
            revision=entry.revision,
            file_path=relative_path,
        )
    else:
        document = existing
        document.title = entry.title
        document.document_type = entry.document_type
        document.file_path = relative_path
        document.status = DocumentStatus.PROCESSING.value
    db.commit()

    try:
        pages = extract_pdf(destination)
        ocr_pages: list[int] = []
        for index, page in enumerate(pages):
            if not page.needs_ocr:
                continue
            previous = None
            if index > 0 and pages[index - 1].blocks:
                previous = pages[index - 1].blocks[-1].section_title
            transcript = transcribe_page(render_page_png(destination, page.page_number))
            pages[index] = replace_page_blocks(
                page,
                blocks_from_transcription(page.page_number, transcript, previous),
            )
            ocr_pages.append(page.page_number)

        drafts = chunk_blocks(
            clean_pages(pages),
            max_tokens=settings.chunk_tokens,
            overlap_tokens=settings.chunk_overlap_tokens,
        )
        if not drafts:
            raise RuntimeError("no text chunks were produced")
        vectors = embed_batch([draft.content for draft in drafts])
        records = [
            ChunkRecord(
                chunk_index=draft.chunk_index,
                page_number=draft.page_number,
                section_title=draft.section_title,
                content=draft.content,
                token_count=draft.token_count,
                embedding=vector,
            )
            for draft, vector in zip(drafts, vectors, strict=True)
        ]
        created = save_chunks(db, document.id, records)
        document.page_count = len(pages)
        activate(db, document)
        db.commit()
        return IngestSummary(
            document_number=entry.document_number,
            revision=entry.revision,
            status=DocumentStatus.ACTIVE.value,
            pages=len(pages),
            chunks_created=created,
            ocr_pages=ocr_pages,
            detail="embedded",
        )
    except Exception as exc:
        logger.exception(
            "Ingestion failed for %s Rev %s: %s",
            entry.document_number,
            entry.revision,
            exc,
        )
        db.rollback()
        failed = get_by_number_and_revision(db, entry.document_number, entry.revision)
        if failed is not None:
            mark_failed(db, failed)
            db.commit()
        return IngestSummary(
            document_number=entry.document_number,
            revision=entry.revision,
            status=DocumentStatus.FAILED.value,
            pages=0,
            chunks_created=0,
            ocr_pages=[],
            detail=str(exc),
        )
