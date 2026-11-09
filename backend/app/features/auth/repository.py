"""Database queries for user accounts."""

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.features.auth.models import User


def get_by_email(db: Session, email: str) -> User | None:
    normalized = email.strip().lower()
    return db.scalar(select(User).where(User.email == normalized))


def get_by_id(db: Session, user_id: uuid.UUID) -> User | None:
    return db.get(User, user_id)


def create_user(
    db: Session,
    *,
    email: str,
    password_hash: str,
    full_name: str | None = None,
    role: str = "SUPERVISOR",
) -> User:
    user = User(
        email=email.strip().lower(),
        password_hash=password_hash,
        full_name=full_name.strip() if full_name else None,
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

