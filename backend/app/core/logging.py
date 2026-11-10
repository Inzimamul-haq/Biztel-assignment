"""Structured logging configuration for the backend."""

import logging
import sys


def setup_logging(level: int = logging.INFO) -> None:
    """Configure root logging once with a clean, readable format and quiet noisy SDK loggers."""
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
        stream=sys.stdout,
    )
    for noisy in ("httpx", "httpx2", "httpcore", "google_genai.models", "uvicorn.access"):
        logging.getLogger(noisy).setLevel(logging.WARNING)
