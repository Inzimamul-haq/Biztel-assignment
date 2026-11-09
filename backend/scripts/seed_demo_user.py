"""Insert the demo supervisor used by the login screen.

Run from the backend directory:

    python -m scripts.seed_demo_user

The account is created only when that email is not already present.
Email: supervisor@shopfloor.local
Password: Shopfloor123
"""

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.features.auth.models import User

DEMO_EMAIL = "supervisor@shopfloor.local"
DEMO_PASSWORD = "Shopfloor123"
DEMO_NAME = "Demo Supervisor"


def seed_demo_user() -> None:
    db = SessionLocal()
    try:
        existing = db.scalar(select(User).where(User.email == DEMO_EMAIL))
        if existing is not None:
            print(f"Demo user already exists: {DEMO_EMAIL}")
            return
        db.add(
            User(
                email=DEMO_EMAIL,
                password_hash=hash_password(DEMO_PASSWORD),
                full_name=DEMO_NAME,
                role="SUPERVISOR",
            )
        )
        db.commit()
        print(f"Created demo user {DEMO_EMAIL}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_user()
