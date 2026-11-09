"""Structured logging configuration for the backend."""

import logging
import sys


def setup_logging(level: int = logging.INFO) -> None:
    """Configure root logging once with a clean, readable format."""
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
        stream=sys.stdout,
    )

