"""Authentication business logic: login, registration, and token verification."""

import uuid

import jwt
from fastapi import status
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.core.security import create_access_token, decode_access_token, hash_password, verify_password
from app.features.auth import repository
from app.features.auth.models import User
from app.features.auth.schemas import LoginRequest, SignupRequest, TokenResponse, UserResponse


def authenticate_user(db: Session, payload: LoginRequest) -> TokenResponse:
    user = repository.get_by_email(db, payload.email)
    if user is None or not verify_password(payload.password, user.password_hash):
        raise AppError(
            detail="Invalid email or password.",
            code="INVALID_CREDENTIALS",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )
    token = create_access_token(user.id, user.email)
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


def register_user(db: Session, payload: SignupRequest) -> TokenResponse:
    existing = repository.get_by_email(db, payload.email)
    if existing is not None:
        raise AppError(
            detail="An account with this email already exists.",
            code="EMAIL_TAKEN",
            status_code=status.HTTP_409_CONFLICT,
        )
    user = repository.create_user(
        db,
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
    )
    token = create_access_token(user.id, user.email)
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


def resolve_user_from_token(db: Session, token: str) -> User:
    try:
        payload = decode_access_token(token)
        raw_sub = payload.get("sub")
        user_id = uuid.UUID(str(raw_sub))
    except (jwt.PyJWTError, ValueError, TypeError) as exc:
        raise AppError(
            detail="Invalid or expired authentication token.",
            code="UNAUTHORIZED",
            status_code=status.HTTP_401_UNAUTHORIZED,
        ) from exc

    user = repository.get_by_id(db, user_id)
    if user is None:
        raise AppError(
            detail="Authenticated user no longer exists.",
            code="UNAUTHORIZED",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )
    return user

