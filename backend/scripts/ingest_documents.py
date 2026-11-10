"""Ingest the PDFs listed in storage/documents/manifest.json.

Run from the backend directory:

    python -m scripts.ingest_documents
    python -m scripts.ingest_documents --spot-check
    python -m scripts.ingest_documents --reingest   # rebuild chunks after chunker changes

Rev 03 of QC-SOP-014 is listed before Rev 04 so the older revision is superseded.
"""

import argparse
import logging
from pathlib import Path

from sqlalchemy import func, select

from app.core.database import SessionLocal
from app.features.documents.models import Document, DocumentChunk
from app.features.ingestion.manifest import load_manifest
from app.features.ingestion.processor import process_document

logger = logging.getLogger(__name__)


def _storage_dir() -> Path:
    return Path(__file__).resolve().parents[1] / "storage" / "documents"


def ingest_all(force: bool = False) -> None:
    storage = _storage_dir()
    entries = load_manifest(storage / "manifest.json")
    db = SessionLocal()
    try:
        for entry in entries:
            summary = process_document(db, entry, storage / entry.filename, storage, force=force)
            ocr = ",".join(str(page) for page in summary.ocr_pages) or "-"
            print(
                f"{summary.document_number} Rev {summary.revision}: "
                f"status={summary.status} pages={summary.pages} "
                f"chunks={summary.chunks_created} ocr_pages={ocr} "
                f"detail={summary.detail}"
            )
    finally:
        db.close()


def spot_check() -> None:
    """Print five stored chunks so a reviewer can compare them with the PDF page."""
    db = SessionLocal()
    try:
        rows = db.execute(
            select(DocumentChunk, Document)
            .join(Document, Document.id == DocumentChunk.document_id)
            .order_by(func.random())
            .limit(5)
        ).all()
        if not rows:
            print("No chunks stored yet.")
            return
        for chunk, document in rows:
            print("-" * 60)
            print(
                f"{document.document_number} Rev {document.revision} "
                f"status={document.status} page={chunk.page_number} "
                f"section={chunk.section_title}"
            )
            print(chunk.content[:500])
    finally:
        db.close()


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s %(message)s")
    parser = argparse.ArgumentParser(description="Embed the plant PDFs listed in manifest.json.")
    parser.add_argument(
        "--spot-check",
        action="store_true",
        help="After ingestion, print 5 stored chunks.",
    )
    parser.add_argument(
        "--reingest",
        action="store_true",
        help="Rebuild chunks for documents that are already ACTIVE or SUPERSEDED.",
    )
    args = parser.parse_args()
    ingest_all(force=args.reingest)
    if args.spot_check:
        spot_check()


if __name__ == "__main__":
    main()
