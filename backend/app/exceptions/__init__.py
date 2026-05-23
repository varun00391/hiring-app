"""Application-specific exceptions."""

from app.exceptions.errors import (
    AppError,
    CandidateNotFoundError,
    CorruptedFileError,
    EmailSendError,
    ExtractionError,
    FileTooLargeError,
    LLMParsingError,
    UnsupportedFileTypeError,
)

__all__ = [
    "AppError",
    "CandidateNotFoundError",
    "CorruptedFileError",
    "EmailSendError",
    "ExtractionError",
    "FileTooLargeError",
    "LLMParsingError",
    "UnsupportedFileTypeError",
]
