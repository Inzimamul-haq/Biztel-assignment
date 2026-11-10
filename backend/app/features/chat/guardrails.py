"""Input guardrails for the chat pipeline (OWASP LLM01 prompt injection, input hygiene)."""

import re
import unicodedata

_CONTROL_CHARS = re.compile(r"[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]")
_WHITESPACE = re.compile(r"\s+")

# Common jailbreak / prompt-injection phrasings. Matching questions never reach the model.
_INJECTION_PATTERNS = [
    re.compile(p, re.IGNORECASE)
    for p in (
        r"\bignore\s+(all\s+|any\s+|the\s+)?(previous|prior|above|earlier)\s+(instructions|rules|prompts?)",
        r"\bdisregard\s+(all\s+|the\s+)?(previous|prior|above|system)\b",
        r"\b(reveal|show|print|repeat|leak)\s+(me\s+)?(your|the)\s+(system\s+)?(prompt|instructions|rules)",
        r"\bsystem\s+prompt\b",
        r"\byou\s+are\s+now\b",
        r"\b(developer|god|dan|jailbreak)\s+mode\b",
        r"\bact\s+as\s+(an?\s+)?(unrestricted|unfiltered)",
        r"\bpretend\s+(you\s+are|to\s+be)\b",
        r"</?\s*(system|assistant|instructions?)\s*>",
        r"\bapi[\s_-]?key\b|\bjwt[\s_-]?secret\b|\bdatabase[\s_-]?url\b",
    )
]

BLOCKED_MESSAGE = (
    "I can't help with that request. I'm here to answer questions about the plant's "
    "safety, quality and maintenance documents."
)


def sanitize_question(raw: str) -> str:
    """Normalize unicode, drop invisible/control characters, and collapse whitespace."""
    normalized = unicodedata.normalize("NFKC", raw)
    cleaned = _CONTROL_CHARS.sub("", normalized)
    return _WHITESPACE.sub(" ", cleaned).strip()


def looks_like_prompt_injection(question: str) -> bool:
    return any(pattern.search(question) for pattern in _INJECTION_PATTERNS)

