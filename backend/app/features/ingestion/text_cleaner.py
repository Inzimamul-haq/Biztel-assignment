"""Remove running headers and footers, and repair line wraps. Warnings stay."""

import re

from app.features.ingestion.pdf_extractor import ExtractedPage, TextBlock

_WARNING = re.compile(r"\b(WARNING|CAUTION|DANGER)\b", re.IGNORECASE)
_PAGE_NUMBER = re.compile(r"^page\s+\d+(\s+of\s+\d+)?$", re.IGNORECASE)
_BOILERPLATE = re.compile(r"uncontrolled copy when printed", re.IGNORECASE)
_WHITESPACE = re.compile(r"[ \t]+")


def clean_pages(pages: list[ExtractedPage]) -> list[TextBlock]:
    """Return cleaned blocks in reading order."""
    repeated = _repeated_edge_lines(pages)
    cleaned: list[TextBlock] = []
    for page in pages:
        kept = [block for block in page.blocks if not _is_noise(block.text, repeated)]
        cleaned.extend(_merge_wrapped_lines(kept))
    return _apply_sections([block for block in cleaned if block.text.strip()])


def _repeated_edge_lines(pages: list[ExtractedPage]) -> set[str]:
    if len(pages) < 2:
        return set()
    first_lines: list[str] = []
    last_lines: list[str] = []
    for page in pages:
        texts = [block.text.strip() for block in page.blocks if block.text.strip()]
        if not texts:
            continue
        first_lines.append(_normalize(texts[0]))
        last_lines.append(_normalize(texts[-1]))
    threshold = max(2, len(pages) // 2)
    repeated: set[str] = set()
    for lines in (first_lines, last_lines):
        counts: dict[str, int] = {}
        for line in lines:
            if line:
                counts[line] = counts.get(line, 0) + 1
        repeated.update(line for line, count in counts.items() if count >= threshold)
    return repeated


def _is_noise(text: str, repeated: set[str]) -> bool:
    stripped = text.strip()
    if not stripped or _WARNING.search(stripped):
        return False
    normalized = _normalize(stripped)
    if normalized in repeated or _BOILERPLATE.search(normalized):
        return True
    return bool(_PAGE_NUMBER.match(normalized))


def _merge_wrapped_lines(blocks: list[TextBlock]) -> list[TextBlock]:
    merged: list[TextBlock] = []
    for block in blocks:
        text = _normalize_whitespace(block.text)
        if not text:
            continue
        current = TextBlock(block.page_number, block.section_title, text, block.kind)
        if (
            merged
            and current.kind == "heading"
            and merged[-1].kind == "heading"
            and _heading_continues(merged[-1].text, current.text)
        ):
            merged[-1] = TextBlock(
                merged[-1].page_number,
                merged[-1].text,
                f"{merged[-1].text} {current.text}",
                "heading",
            )
            continue
        if (
            merged
            and current.kind == "paragraph"
            and merged[-1].kind == "paragraph"
            and merged[-1].page_number == current.page_number
            and merged[-1].section_title == current.section_title
        ):
            joined = _join_wrap(merged[-1].text, current.text)
            if joined is not None:
                merged[-1] = TextBlock(
                    merged[-1].page_number,
                    merged[-1].section_title,
                    joined,
                    "paragraph",
                )
                continue
        merged.append(current)
    return merged


def _apply_sections(blocks: list[TextBlock]) -> list[TextBlock]:
    """Point every block at the heading it sits under, including joined headings."""
    section: str | None = None
    applied: list[TextBlock] = []
    for block in blocks:
        if block.kind == "heading":
            section = block.text.strip()
        applied.append(TextBlock(block.page_number, section, block.text, block.kind))
    return applied


def _heading_continues(left: str, right: str) -> bool:
    if re.match(r"^\d+\.\s", right):
        return False
    return right[:1].islower() or left.endswith(("from", "-", ","))


def _join_wrap(left: str, right: str) -> str | None:
    if left.endswith("-"):
        return f"{left[:-1]}{right}"
    if right[:1].islower() and not re.search(r"[.!?:>]$", left):
        return f"{left} {right}"
    return None


def _normalize(text: str) -> str:
    return _WHITESPACE.sub(" ", text).strip().lower()


def _normalize_whitespace(text: str) -> str:
    text = text.replace("\u00a0", " ")
    text = _WHITESPACE.sub(" ", text)
    return text.strip()
