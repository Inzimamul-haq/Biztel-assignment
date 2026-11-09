"""Settings loaded from the environment. Nothing secret is hardcoded."""

from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _normalize_pg_url(url: str) -> str:
    """Convert standard postgres:// or postgresql:// URLs (e.g. from Neon) to postgresql+psycopg://."""
    raw = url.strip()
    if raw.startswith("postgres://"):
        return "postgresql+psycopg://" + raw[len("postgres://") :]
    if raw.startswith("postgresql://"):
        return "postgresql+psycopg://" + raw[len("postgresql://") :]
    return raw


class Settings(BaseSettings):
    """Runtime configuration. Model names and thresholds come from `.env`."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = Field(
        default="postgresql+psycopg://postgres:postgres@localhost:5432/shopfloor",
        alias="DATABASE_URL",
    )
    direct_url: str = Field(
        default="",
        alias="DIRECT_URL",
    )
    gemini_api_key: str = Field(default="", alias="GEMINI_API_KEY")
    gemini_chat_model: str = Field(default="gemini-2.5-flash", alias="GEMINI_CHAT_MODEL")
    gemini_embedding_model: str = Field(
        default="gemini-embedding-001",
        alias="GEMINI_EMBEDDING_MODEL",
    )
    embedding_dim: int = Field(default=768, alias="EMBEDDING_DIM")
    jwt_secret: str = Field(default="change-me", alias="JWT_SECRET")
    jwt_expire_minutes: int = Field(default=720, alias="JWT_EXPIRE_MINUTES")
    cors_origins: str = Field(default="http://localhost:3000", alias="CORS_ORIGINS")
    top_k: int = Field(default=5, alias="TOP_K")
    min_similarity: float = Field(default=0.5, alias="MIN_SIMILARITY")
    chunk_tokens: int = Field(default=650, alias="CHUNK_TOKENS")
    chunk_overlap_tokens: int = Field(default=85, alias="CHUNK_OVERLAP_TOKENS")
    max_question_chars: int = Field(default=500, alias="MAX_QUESTION_CHARS")

    @field_validator("database_url", mode="after")
    @classmethod
    def _validate_database_url(cls, value: str) -> str:
        return _normalize_pg_url(value)

    @field_validator("direct_url", mode="after")
    @classmethod
    def _validate_direct_url(cls, value: str) -> str:
        return _normalize_pg_url(value) if value.strip() else ""

    @property
    def effective_direct_url(self) -> str:
        """Direct database URL for DDL/schema migrations (falls back to database_url)."""
        return self.direct_url or self.database_url

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
