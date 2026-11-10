"""Retrieval keeps strong type filters and retries when the filter is weak."""

import uuid

from app.features.chat import retrieval
from app.features.documents.schemas import RetrievedChunk


def _chunk(similarity: float, document_type: str = "SAFETY_SOP") -> RetrievedChunk:
    return RetrievedChunk(
        id=uuid.uuid4(),
        content="Isolate the machine.",
        page_number=1,
        section_title="Lockout Procedure",
        document_number="SAF-SOP-003",
        title="Lockout / Tagout (LOTO) - Safety Procedure",
        revision="05",
        document_type=document_type,
        similarity=similarity,
    )


def test_weak_type_filter_retries_without_the_filter(monkeypatch) -> None:
    calls: list[list[str] | None] = []

    def fake_search(db, embedding, document_types, limit):
        calls.append(document_types)
        if document_types == ["QUALITY_SOP"]:
            return [_chunk(0.2, "QUALITY_SOP")]
        return [_chunk(0.91, "SAFETY_SOP")]

    monkeypatch.setattr(retrieval, "search_chunks", fake_search)
    found = retrieval.retrieve(None, [0.1], ["QUALITY_SOP"])

    assert calls == [["QUALITY_SOP"], None]
    assert found[0].similarity == 0.91


def test_strong_type_filter_is_kept(monkeypatch) -> None:
    calls: list[list[str] | None] = []

    def fake_search(db, embedding, document_types, limit):
        calls.append(document_types)
        return [_chunk(0.8)]

    monkeypatch.setattr(retrieval, "search_chunks", fake_search)
    found = retrieval.retrieve(None, [0.1], ["SAFETY_SOP"])

    assert calls == [["SAFETY_SOP"]]
    assert found[0].document_type == "SAFETY_SOP"


def test_empty_filter_searches_every_active_document(monkeypatch) -> None:
    calls: list[list[str] | None] = []

    def fake_search(db, embedding, document_types, limit):
        calls.append(document_types)
        return []

    monkeypatch.setattr(retrieval, "search_chunks", fake_search)
    retrieval.retrieve(None, [0.1], None)

    assert calls == [None]


def test_search_statement_keeps_only_active_documents() -> None:
    from sqlalchemy.dialects import postgresql

    from app.features.documents.repository import build_search_statement

    statement = build_search_statement([0.0, 0.0], ["SAFETY_SOP"], 5)
    compiled = str(statement.compile(dialect=postgresql.dialect(), compile_kwargs={"literal_binds": True}))
    assert "ACTIVE" in compiled
    assert "SUPERSEDED" not in compiled
    assert "SAFETY_SOP" in compiled


def test_classifier_falls_back_on_invalid_json(monkeypatch) -> None:
    from app.features.chat import classifier
    from app.features.chat.enums import Scope

    monkeypatch.setattr(classifier, "generate_text", lambda prompt, json_mode=True: "not valid json")
    result = classifier.classify_question("How do I lock out the TX-200?")

    assert result.scope == Scope.COMBINED
    assert result.document_types == []
    assert result.search_query == "How do I lock out the TX-200?"


def test_evidence_check_blocks_weak_or_empty_chunks() -> None:
    from app.features.chat.enums import ResponseStatus
    from app.features.chat.evidence import check_evidence

    empty = check_evidence([], min_similarity=0.5)
    assert not empty.is_sufficient
    assert empty.status == ResponseStatus.NOT_FOUND

    weak = check_evidence([_chunk(0.35)], min_similarity=0.5)
    assert not weak.is_sufficient
    assert weak.status == ResponseStatus.INSUFFICIENT_EVIDENCE

    strong = check_evidence([_chunk(0.82)], min_similarity=0.5)
    assert strong.is_sufficient
    assert strong.status is None


def test_answer_generator_filters_unretrieved_chunk_ids_and_handles_bad_json(monkeypatch) -> None:
    import json

    from app.features.chat import answer_generator
    from app.features.chat.enums import ResponseStatus

    chunk = _chunk(0.88)
    fake_id = str(uuid.uuid4())

    payload = {
        "response_status": "ANSWERED",
        "answer": "Isolate energy sources per SAF-SOP-003.",
        "warnings": ["Verify zero energy state before work."],
        "used_chunk_ids": [str(chunk.id), fake_id],
    }
    monkeypatch.setattr(answer_generator, "generate_text", lambda *args, **kwargs: json.dumps(payload))
    res = answer_generator.generate_grounded_answer("Lockout procedure?", [chunk])

    assert res.response_status == ResponseStatus.ANSWERED
    assert res.used_chunk_ids == [str(chunk.id)]
    assert res.warnings == ["Verify zero energy state before work."]

    monkeypatch.setattr(answer_generator, "generate_text", lambda *args, **kwargs: "{broken json")
    bad = answer_generator.generate_grounded_answer("Lockout procedure?", [chunk])
    assert bad.response_status == ResponseStatus.INSUFFICIENT_EVIDENCE
    assert bad.used_chunk_ids == []


def test_rag_pipeline_out_of_scope_skips_retrieval(monkeypatch) -> None:
    from app.features.chat import service
    from app.features.chat.classifier import ClassificationResult
    from app.features.chat.enums import ResponseStatus, Scope

    monkeypatch.setattr(
        service,
        "classify_question",
        lambda q, **kwargs: ClassificationResult(scope=Scope.OUT_OF_SCOPE, document_types=[], search_query=q),
    )
    result = service.run_rag_pipeline(None, "Hello, how is the weather?")

    assert result.response_status == ResponseStatus.NOT_FOUND
    assert result.sources == []
    assert result.warnings == []

