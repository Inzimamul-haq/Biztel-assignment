"""Document lifecycle and the kinds of plant documents we ingest."""

from enum import Enum


class DocumentStatus(str, Enum):
    PROCESSING = "PROCESSING"
    ACTIVE = "ACTIVE"
    SUPERSEDED = "SUPERSEDED"
    FAILED = "FAILED"


class DocumentType(str, Enum):
    MACHINE_MANUAL = "MACHINE_MANUAL"
    SAFETY_SOP = "SAFETY_SOP"
    QUALITY_SOP = "QUALITY_SOP"
    MAINTENANCE_SOP = "MAINTENANCE_SOP"
