"""Gemini Vision transcription for pages PyMuPDF cannot read."""

import re

from app.features.ingestion.pdf_extractor import TextBlock
from app.shared.ai.gemini_client import generate_from_image

OCR_PROMPT = """Transcribe this scanned document page into plain text.
Preserve headings, warnings, cautions, and table rows.
Put each table row on its own line and separate cells with " | ".
Do not add commentary, and do not invent text that is not on the page."""

_HEADING_HINT = re.compile(r"^[A-Z][A-Za-z0-9 /,&-]{2,80}$")


def transcribe_page(image_png: bytes) -> str:
    """Return the text Gemini reads from one page image."""
    return generate_from_image(OCR_PROMPT, image_png)


def blocks_from_transcription(
    page_number: int,
    text: str,
    section_title: str | None,
) -> list[TextBlock]:
    """Turn OCR text into heading and paragraph blocks for the cleaner."""
    blocks: list[TextBlock] = []
    section = section_title
    for raw_line in text.splitlines():
        line = " ".join(raw_line.split())
        if not line:
            continue
        if _looks_like_heading(line):
            section = line
            blocks.append(
                TextBlock(
                    page_number=page_number,
                    section_title=section,
                    text=line,
                    kind="heading",
                )
            )
            continue
        kind = "table" if " | " in line else "paragraph"
        blocks.append(
            TextBlock(
                page_number=page_number,
                section_title=section,
                text=line,
                kind=kind,
            )
        )
    return blocks


def _looks_like_heading(line: str) -> bool:
    if line.upper().startswith(("WARNING", "CAUTION", "DANGER", "NOTE")):
        return False
    if len(line) > 80 or line.endswith((".", ";", ":")):
        return False
    letters = [char for char in line if char.isalpha()]
    if letters and all(char.isupper() for char in letters) and len(line.split()) <= 10:
        return True
    return bool(_HEADING_HINT.match(line)) and len(line.split()) <= 8
