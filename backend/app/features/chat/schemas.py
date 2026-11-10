"""Request and response schemas for the chat pipeline (Section 6.3)."""

import uuid

from pydantic import BaseModel, Field

from app.features.chat.enums import ResponseStatus


class SourceRef(BaseModel):
    document_number: str
    title: str
    revision: str
    page_number: int
    section_title: str | None = None


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=500)
    conversation_id: uuid.UUID | None = None
    language: str = Field(default="en-IN", max_length=15)


class ChatPipelineResult(BaseModel):
    response_status: ResponseStatus
    answer: str
    warnings: list[str] = Field(default_factory=list)
    sources: list[SourceRef] = Field(default_factory=list)


class ChatResponse(BaseModel):
    conversation_id: uuid.UUID
    message_id: uuid.UUID
    response_status: ResponseStatus
    answer: str
    warnings: list[str] = Field(default_factory=list)
    sources: list[SourceRef] = Field(default_factory=list)
