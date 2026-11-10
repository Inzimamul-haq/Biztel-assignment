"""Split cleaned document text into overlapping chunks with source metadata."""

import re
from dataclasses import dataclass

from app.features.ingestion.pdf_extractor import TextBlock

_SENTENCE_BREAK = re.compile(r"(?<=[.!?])\s+")
_WARNING = re.compile(r"^\s*(WARNING|CAUTION|DANGER)\b", re.IGNORECASE)


@dataclass
class ChunkDraft:
    chunk_index: int
    page_number: int
    section_title: str | None
    content: str
    token_count: int


def estimate_tokens(text: str) -> int:
    """Approximate tokens at about four characters each."""
    stripped = text.strip()
    if not stripped:
        return 0
    return max(1, round(len(stripped) / 4))


def chunk_blocks(
    blocks: list[TextBlock],
    *,
    max_tokens: int = 650,
    overlap_tokens: int = 85,
    hard_max_tokens: int = 800,
) -> list[ChunkDraft]:
    """Build chunks of about max_tokens, overlapping by overlap_tokens.

    Each chunk records the page and section where its text starts.
    A warning is kept with the step that follows it.
    """
    units = _explode(blocks, hard_max_tokens)
    chunks: list[ChunkDraft] = []
    buffer: list[TextBlock] = []
    index = 0

    def flush() -> list[TextBlock]:
        if not buffer:
            return []
        _append_chunk(chunks, buffer)
        return _tail(buffer, overlap_tokens)

    while index < len(units):
        unit = units[index]
        # Citation accuracy: a chunk never crosses a page or a section heading,
        # so its page_number and section_title describe all of its content.
        # No overlap is carried across these hard boundaries.
        if buffer and _has_body(buffer) and (
            unit.kind == "heading" or unit.page_number != buffer[-1].page_number
        ):
            _append_chunk(chunks, buffer)
            buffer = []

        if _is_warning(unit.text) and index + 1 < len(units):
            pair = [unit, units[index + 1]]
            pair_would_overflow = bool(buffer) and (
                _tokens(buffer) >= max_tokens or _tokens(buffer) + _tokens(pair) > max_tokens
            )
            if pair_would_overflow or (
                buffer and _tokens(buffer) + _tokens(pair) > hard_max_tokens
            ):
                buffer = flush()
            buffer.extend(pair)
            index += 2
            if _tokens(buffer) >= max_tokens:
                buffer = flush()
            continue

        if buffer and _tokens(buffer) + estimate_tokens(unit.text) > max_tokens:
            buffer = flush()

        buffer.append(unit)
        index += 1

    if buffer:
        _append_chunk(chunks, buffer)
    return chunks


def _append_chunk(chunks: list[ChunkDraft], blocks: list[TextBlock]) -> None:
    content = _render(blocks)
    if not content:
        return
    body = [block for block in blocks if block.kind != "heading"]
    chunks.append(
        ChunkDraft(
            chunk_index=len(chunks),
            page_number=(body[0] if body else blocks[0]).page_number,
            section_title=_section_title(blocks),
            content=content,
            token_count=estimate_tokens(content),
        )
    )


def _explode(blocks: list[TextBlock], hard_max_tokens: int) -> list[TextBlock]:
    pieces: list[TextBlock] = []
    for block in blocks:
        text = " ".join(block.text.split())
        if not text:
            continue
        if block.kind == "heading" or estimate_tokens(text) <= hard_max_tokens:
            pieces.append(TextBlock(block.page_number, block.section_title, text, block.kind))
            continue
        for part in _split_text(text, hard_max_tokens):
            pieces.append(TextBlock(block.page_number, block.section_title, part, block.kind))
    return pieces


def _split_text(text: str, hard_max_tokens: int) -> list[str]:
    sentences = [part.strip() for part in _SENTENCE_BREAK.split(text) if part.strip()]
    if not sentences:
        sentences = [text]
    parts: list[str] = []
    current = ""
    for sentence in sentences:
        if estimate_tokens(sentence) > hard_max_tokens:
            if current:
                parts.append(current)
                current = ""
            parts.extend(_split_words(sentence, hard_max_tokens))
            continue
        candidate = f"{current} {sentence}".strip()
        if current and estimate_tokens(candidate) > hard_max_tokens:
            parts.append(current)
            current = sentence
        else:
            current = candidate
    if current:
        parts.append(current)
    return parts


def _split_words(text: str, hard_max_tokens: int) -> list[str]:
    parts: list[str] = []
    current: list[str] = []
    for word in text.split():
        candidate = " ".join([*current, word])
        if current and estimate_tokens(candidate) > hard_max_tokens:
            parts.append(" ".join(current))
            current = [word]
        else:
            current.append(word)
    if current:
        parts.append(" ".join(current))
    return parts


def _tail(blocks: list[TextBlock], overlap_tokens: int) -> list[TextBlock]:
    if overlap_tokens <= 0:
        return []
    chosen: list[TextBlock] = []
    total = 0
    for block in reversed(blocks):
        chosen.append(block)
        total += estimate_tokens(block.text)
        if block.kind == "heading" or total >= overlap_tokens:
            break
    chosen.reverse()
    return chosen


def _render(blocks: list[TextBlock]) -> str:
    parts = [" ".join(block.text.split()) for block in blocks]
    return "\n\n".join(part for part in parts if part)


def _section_title(blocks: list[TextBlock]) -> str | None:
    for block in blocks:
        if block.kind == "heading" and block.text.strip():
            return block.text.strip()
        if block.section_title:
            return block.section_title
    return None


def _has_body(blocks: list[TextBlock]) -> bool:
    return any(block.kind != "heading" for block in blocks)


def _tokens(blocks: list[TextBlock]) -> int:
    return sum(estimate_tokens(block.text) for block in blocks)


def _is_warning(text: str) -> bool:
    return bool(_WARNING.match(text))
