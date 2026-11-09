"""Pull text, headings, and tables out of a PDF with PyMuPDF."""

from dataclasses import dataclass, replace
from pathlib import Path
from statistics import median

import pymupdf

MIN_PAGE_CHARS = 30


@dataclass
class TextBlock:
    page_number: int
    section_title: str | None
    text: str
    kind: str = "paragraph"


@dataclass
class ExtractedPage:
    page_number: int
    blocks: list[TextBlock]
    plain_text: str
    needs_ocr: bool


def extract_pdf(path: Path) -> list[ExtractedPage]:
    """Read every page. Pages with almost no text are flagged for OCR."""
    document = pymupdf.open(path)
    try:
        pages: list[ExtractedPage] = []
        section: str | None = None
        for index, page in enumerate(document, start=1):
            extracted, section = _extract_page(page, index, section)
            pages.append(extracted)
        return pages
    finally:
        document.close()


def render_page_png(path: Path, page_number: int) -> bytes:
    """Rasterize one page so the OCR fallback can read a scanned page."""
    document = pymupdf.open(path)
    try:
        page = document[page_number - 1]
        pixmap = page.get_pixmap(matrix=pymupdf.Matrix(2, 2))
        return pixmap.tobytes("png")
    finally:
        document.close()


def _extract_page(
    page: pymupdf.Page,
    page_number: int,
    section: str | None,
) -> tuple[ExtractedPage, str | None]:
    # The text layer already keeps table rows readable. PyMuPDF's table finder
    # drops spaces in these plant PDFs, so it is not used.
    blocks, section = _text_blocks(page, page_number, section)
    plain_text = "\n".join(block.text for block in blocks if block.text.strip())
    return (
        ExtractedPage(
            page_number=page_number,
            blocks=blocks,
            plain_text=plain_text,
            needs_ocr=len(plain_text.strip()) < MIN_PAGE_CHARS,
        ),
        section,
    )


def _text_blocks(
    page: pymupdf.Page,
    page_number: int,
    section: str | None,
) -> tuple[list[TextBlock], str | None]:
    data = page.get_text("dict")
    sizes = [
        span["size"]
        for block in data.get("blocks", [])
        if block.get("type") == 0
        for line in block.get("lines", [])
        for span in line.get("spans", [])
        if span.get("text", "").strip()
    ]
    body_size = median(sizes) if sizes else 11.0
    blocks: list[TextBlock] = []
    for block in data.get("blocks", []):
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            text, size, flags = _line_style(line)
            if not text:
                continue
            if _is_heading(text, size, flags, body_size):
                section = text
                blocks.append(
                    TextBlock(
                        page_number=page_number,
                        section_title=section,
                        text=text,
                        kind="heading",
                    )
                )
                continue
            blocks.append(
                TextBlock(
                    page_number=page_number,
                    section_title=section,
                    text=text,
                    kind="paragraph",
                )
            )
    return blocks, section


def _line_style(line: dict) -> tuple[str, float, int]:
    spans = line.get("spans", [])
    text = "".join(span.get("text", "") for span in spans).strip()
    if not spans or not text:
        return "", 0.0, 0
    size = max(float(span.get("size", 0)) for span in spans)
    flags = 0
    for span in spans:
        flags |= int(span.get("flags", 0))
    return text, size, flags


def _is_heading(text: str, size: float, flags: int, body_size: float) -> bool:
    if len(text) > 90 or text.endswith((".", ";", ",")):
        return False
    bold = bool(flags & 16)
    larger = size >= body_size * 1.15 and size > body_size
    return larger or (bold and len(text) <= 80)


def replace_page_blocks(page: ExtractedPage, blocks: list[TextBlock]) -> ExtractedPage:
    """Used after OCR replaces an unreadable page."""
    plain_text = "\n".join(block.text for block in blocks if block.text.strip())
    return replace(page, blocks=blocks, plain_text=plain_text, needs_ocr=False)
