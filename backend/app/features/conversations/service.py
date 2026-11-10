"""Service layer for conversation ownership checks, message history, and deletion."""

import uuid

from fastapi import status
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.features.conversations import repository
from app.features.conversations.models import Conversation
from app.features.conversations.schemas import ConversationResponse, MessageResponse


def get_owned_conversation(
    db: Session,
    conversation_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Conversation:
    """Return the conversation if it exists and belongs to `user_id`, else raise AppError."""
    conversation = repository.get_conversation_by_id(db, conversation_id)
    if conversation is None or conversation.user_id != user_id:
        raise AppError(
            detail="Conversation not found.",
            code="CONVERSATION_NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
        )
    return conversation


def list_conversations_for_user(
    db: Session,
    user_id: uuid.UUID,
) -> list[ConversationResponse]:
    conversations = repository.list_user_conversations(db, user_id)
    return [ConversationResponse.model_validate(item) for item in conversations]


def list_messages_for_user_conversation(
    db: Session,
    conversation_id: uuid.UUID,
    user_id: uuid.UUID,
) -> list[MessageResponse]:
    conversation = get_owned_conversation(db, conversation_id, user_id)
    messages = repository.list_conversation_messages(db, conversation.id)
    return [MessageResponse.model_validate(msg) for msg in messages]


def delete_user_conversation(
    db: Session,
    conversation_id: uuid.UUID,
    user_id: uuid.UUID,
) -> None:
    conversation = get_owned_conversation(db, conversation_id, user_id)
    repository.delete_conversation(db, conversation)
    db.commit()
