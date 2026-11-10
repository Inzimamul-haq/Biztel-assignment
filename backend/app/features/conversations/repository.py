"""Database operations for user conversations and messages."""

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.features.conversations.models import Conversation, Message


def create_conversation(db: Session, *, user_id: uuid.UUID, title: str) -> Conversation:
    truncated_title = title.strip()[:60]
    conversation = Conversation(
        user_id=user_id,
        title=truncated_title,
    )
    db.add(conversation)
    db.flush()
    return conversation


def get_conversation_by_id(db: Session, conversation_id: uuid.UUID) -> Conversation | None:
    return db.get(Conversation, conversation_id)


def list_user_conversations(db: Session, user_id: uuid.UUID) -> list[Conversation]:
    stmt = (
        select(Conversation)
        .where(Conversation.user_id == user_id)
        .order_by(Conversation.updated_at.desc(), Conversation.created_at.desc())
    )
    return list(db.scalars(stmt).all())


def list_conversation_messages(db: Session, conversation_id: uuid.UUID) -> list[Message]:
    stmt = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
    )
    return list(db.scalars(stmt).all())


def add_message(
    db: Session,
    *,
    conversation: Conversation,
    role: str,
    content: str,
    response_status: str | None = None,
    warnings: list[str] | None = None,
    sources: list[dict[str, Any]] | None = None,
) -> Message:
    message = Message(
        conversation_id=conversation.id,
        role=role,
        content=content,
        response_status=response_status,
        warnings=warnings if warnings is not None else [],
        sources=sources if sources is not None else [],
    )
    conversation.updated_at = datetime.now(UTC)
    db.add(message)
    db.flush()
    return message


def delete_conversation(db: Session, conversation: Conversation) -> None:
    db.delete(conversation)
    db.flush()
