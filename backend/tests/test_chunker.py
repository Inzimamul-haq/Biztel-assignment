"""Chunker behaviour: page metadata, overlap, and warning grouping."""

from app.features.ingestion.chunker import chunk_blocks
from app.features.ingestion.pdf_extractor import TextBlock


def test_chunk_records_start_page_and_section() -> None:
    blocks = [
        TextBlock(1, None, "Startup", "heading"),
        TextBlock(1, "Startup", "word " * 200, "paragraph"),
        TextBlock(3, "Startup", "later " * 200, "paragraph"),
    ]
    chunks = chunk_blocks(blocks, max_tokens=50, overlap_tokens=0, hard_max_tokens=120)

    assert chunks
    assert chunks[0].page_number == 1
    assert chunks[0].section_title == "Startup"
    assert any(chunk.page_number == 3 for chunk in chunks)
    assert [chunk.chunk_index for chunk in chunks] == list(range(len(chunks)))
    assert all(chunk.token_count <= 120 for chunk in chunks)


def test_overlap_repeats_the_previous_tail() -> None:
    blocks = [
        TextBlock(1, "Steps", f"Paragraph {index} " + ("word " * 30), "paragraph")
        for index in range(12)
    ]
    chunks = chunk_blocks(blocks, max_tokens=80, overlap_tokens=30, hard_max_tokens=160)

    assert len(chunks) >= 2
    tail = chunks[0].content.split("\n\n")[-1]
    assert tail in chunks[1].content


def test_warning_stays_with_the_following_step() -> None:
    blocks = [
        TextBlock(1, "Hose", "Check the area. " * 40, "paragraph"),
        TextBlock(
            2,
            "Hose",
            "WARNING: Release stored hydraulic pressure before loosening any fitting.",
            "paragraph",
        ),
        TextBlock(
            2,
            "Hose",
            "Loosen the fitting slowly and confirm the gauge reads zero.",
            "paragraph",
        ),
    ]
    chunks = chunk_blocks(blocks, max_tokens=40, overlap_tokens=0, hard_max_tokens=200)

    match = next(chunk for chunk in chunks if "WARNING:" in chunk.content)
    assert "Loosen the fitting slowly" in match.content
    assert match.page_number == 2
    assert match.section_title == "Hose"


def test_new_heading_updates_the_section_title() -> None:
    blocks = [
        TextBlock(1, None, "Purpose", "heading"),
        TextBlock(1, "Purpose", "word " * 80, "paragraph"),
        TextBlock(1, "Purpose", "Lockout Procedure", "heading"),
        TextBlock(1, "Lockout Procedure", "word " * 80, "paragraph"),
    ]
    chunks = chunk_blocks(blocks, max_tokens=40, overlap_tokens=0, hard_max_tokens=100)
    titles = {chunk.section_title for chunk in chunks}

    assert "Purpose" in titles
    assert "Lockout Procedure" in titles
