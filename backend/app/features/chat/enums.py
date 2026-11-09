"""Response statuses and question classification scopes."""

from enum import Enum


class ResponseStatus(str, Enum):
    ANSWERED = "ANSWERED"
    NOT_FOUND = "NOT_FOUND"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"
    ERROR = "ERROR"


class Scope(str, Enum):
    SAFETY = "SAFETY"
    QUALITY = "QUALITY"
    MAINTENANCE = "MAINTENANCE"
    MACHINE = "MACHINE"
    COMBINED = "COMBINED"
    OUT_OF_SCOPE = "OUT_OF_SCOPE"
