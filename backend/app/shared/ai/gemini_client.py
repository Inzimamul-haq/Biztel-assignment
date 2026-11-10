"""Gemini calls with a timeout, one retry, and latency logging."""

import logging
import time
from collections.abc import Callable
from typing import TypeVar

from google import genai
from google.genai import types

from app.core.config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T")
_client: genai.Client | None = None


def get_client() -> genai.Client:
    """Build the Gemini client once. Fails clearly when the API key is missing."""
    global _client
    if _client is None:
        if not settings.gemini_api_key.strip():
            raise RuntimeError("GEMINI_API_KEY is not set")
        _client = genai.Client(
            api_key=settings.gemini_api_key,
            http_options=types.HttpOptions(timeout=30_000),
        )
    return _client


def reset_client() -> None:
    """Drop the cached client. Tests use this after changing settings."""
    global _client
    _client = None


def _call_with_retry(operation: str, fn: Callable[[], T]) -> T:
    last_error: Exception | None = None
    for attempt in (1, 2):
        started = time.perf_counter()
        try:
            result = fn()
        except Exception as exc:
            elapsed_ms = (time.perf_counter() - started) * 1000
            logger.warning(
                "%s failed attempt=%s latency_ms=%.0f error=%s",
                operation,
                attempt,
                elapsed_ms,
                type(exc).__name__,
            )
            last_error = exc
            continue
        elapsed_ms = (time.perf_counter() - started) * 1000
        logger.debug("%s succeeded attempt=%s latency_ms=%.0f", operation, attempt, elapsed_ms)
        return result
    assert last_error is not None
    raise last_error


def generate_text(
    prompt: str,
    *,
    json_mode: bool = False,
    response_schema: type | None = None,
) -> str:
    """Generate text from the chat model. Set json_mode or response_schema for structured output."""

    def _call() -> str:
        config = types.GenerateContentConfig(
            temperature=0.1,
            response_mime_type="application/json" if (json_mode or response_schema is not None) else None,
            response_schema=response_schema,
        )
        response = get_client().models.generate_content(
            model=settings.gemini_chat_model,
            contents=prompt,
            config=config,
        )
        text = (response.text or "").strip()
        if not text:
            raise ValueError("Gemini returned an empty response")
        return text

    return _call_with_retry("gemini.generate", _call)


def generate_from_image(prompt: str, image_png: bytes) -> str:
    """Send one page image to the chat model and return the transcribed text."""

    def _call() -> str:
        response = get_client().models.generate_content(
            model=settings.gemini_chat_model,
            contents=[
                prompt,
                types.Part.from_bytes(data=image_png, mime_type="image/png"),
            ],
            config=types.GenerateContentConfig(temperature=0.0),
        )
        text = (response.text or "").strip()
        if not text:
            raise ValueError("Gemini vision returned an empty response")
        return text

    return _call_with_retry("gemini.vision", _call)


def embed_texts(texts: list[str], task_type: str) -> list[list[float]]:
    """Embed a batch of strings. task_type is a Gemini embedding task type."""
    if not texts:
        return []

    def _call() -> list[list[float]]:
        response = get_client().models.embed_content(
            model=settings.gemini_embedding_model,
            contents=texts,
            config=types.EmbedContentConfig(
                task_type=task_type,
                output_dimensionality=settings.embedding_dim,
            ),
        )
        vectors: list[list[float]] = []
        for embedding in response.embeddings or []:
            values = list(embedding.values or [])
            if len(values) != settings.embedding_dim:
                raise ValueError(
                    f"Expected embedding length {settings.embedding_dim}, got {len(values)}"
                )
            vectors.append(values)
        if len(vectors) != len(texts):
            raise ValueError("Gemini returned a different number of embeddings than inputs")
        return vectors

    return _call_with_retry("gemini.embed", _call)
