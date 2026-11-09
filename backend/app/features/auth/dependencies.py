"""FastAPI dependency to extract and validate the current user from a Bearer JWT."""

from fastapi import Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.errors import AppError
from app.features.auth.models import User
from app.features.auth.service import resolve_user_from_token

_bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer" or not credentials.credentials:
        raise AppError(
            detail="Authentication credentials were not provided.",
            code="UNAUTHORIZED",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )
    return resolve_user_from_token(db, credentials.credentials)

