"""Create the pgvector extension, the five tables, and the vector index.

Run from the backend directory:

    python -m scripts.init_db
    python -m scripts.init_db --verify
"""

import argparse
import uuid

from sqlalchemy import text

from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.features.auth.models import User
from app.features.conversations.models import Conversation, Message
from app.features.documents.enums import DocumentStatus, DocumentType
from app.features.documents.models import Document, DocumentChunk


def create_schema() -> None:
    """Enable pgvector and create tables plus the partial and HNSW indexes."""
    with engine.begin() as connection:
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    Base.metadata.create_all(bind=engine)
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                CREATE UNIQUE INDEX IF NOT EXISTS uq_documents_one_active
                ON documents (document_number)
                WHERE status = 'ACTIVE'
                """
            )
        )
        connection.execute(
            text(
                """
                CREATE INDEX IF NOT EXISTS ix_document_chunks_embedding_hnsw
                ON document_chunks
                USING hnsw (embedding vector_cosine_ops)
                """
            )
        )


def verify_roundtrip() -> None:
    """Insert one row into every table, read it back, then roll the work back."""
    db = SessionLocal()
    try:
        user = User(
            email=f"verify-{uuid.uuid4()}@example.com",
            password_hash="not-a-real-hash",
            full_name="Schema Verify",
            role="SUPERVISOR",
        )
        db.add(user)
        db.flush()

        document = Document(
            document_number=f"VERIFY-{uuid.uuid4().hex[:8]}",
            title="Schema verify",
            document_type=DocumentType.SAFETY_SOP.value,
            revision="00",
            status=DocumentStatus.PROCESSING.value,
            file_path="storage/documents/verify.pdf",
            page_count=1,
        )
        db.add(document)
        db.flush()

        chunk = DocumentChunk(
            document_id=document.id,
            chunk_index=0,
            page_number=1,
            section_title="Verify",
            content="Round-trip check.",
            token_count=3,
            embedding=[0.0] * settings.embedding_dim,
        )
        db.add(chunk)
        db.flush()

        conversation = Conversation(user_id=user.id, title="Verify conversation")
        db.add(conversation)
        db.flush()

        message = Message(
            conversation_id=conversation.id,
            role="USER",
            content="Does the schema round-trip?",
        )
        db.add(message)
        db.flush()

        assert db.get(User, user.id) is not None
        assert db.get(Document, document.id) is not None
        assert db.get(DocumentChunk, chunk.id) is not None
        assert db.get(Conversation, conversation.id) is not None
        assert db.get(Message, message.id) is not None
        db.rollback()
        print(
            "Verified insert and read for users, documents, document_chunks, "
            "conversations, and messages."
        )
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Create the shop-floor database schema.")
    parser.add_argument(
        "--verify",
        action="store_true",
        help="Insert and read one row in every table, then roll back.",
    )
    args = parser.parse_args()
    create_schema()
    print("Schema is ready.")
    if args.verify:
        verify_roundtrip()


if __name__ == "__main__":
    main()
