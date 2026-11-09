"""Read the manifest that sits next to the source PDFs."""

import json
from dataclasses import dataclass
from pathlib import Path

from app.features.documents.enums import DocumentType


@dataclass
class ManifestEntry:
    filename: str
    document_number: str
    title: str
    document_type: str
    revision: str


def load_manifest(path: Path) -> list[ManifestEntry]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(raw, list):
        raise ValueError("manifest.json must be a list of documents")
    allowed = {item.value for item in DocumentType}
    entries: list[ManifestEntry] = []
    for item in raw:
        document_type = str(item["document_type"])
        if document_type not in allowed:
            raise ValueError(f"Unknown document_type: {document_type}")
        entries.append(
            ManifestEntry(
                filename=str(item["filename"]),
                document_number=str(item["document_number"]),
                title=str(item["title"]),
                document_type=document_type,
                revision=str(item["revision"]),
            )
        )
    return entries
