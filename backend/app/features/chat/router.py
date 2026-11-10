"""HTTP route for `POST /api/chat`."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.features.auth.dependencies import get_current_user
from app.features.auth.models import User
from app.features.chat.schemas import ChatRequest, ChatResponse
from app.features.chat.service import handle_chat_request

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
def ask_question(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ChatResponse:
    return handle_chat_request(db, user_id=current_user.id, payload=payload)

