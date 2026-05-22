"""Application-specific exceptions."""

from app.exceptions.errors import (
    AppError,
    CorruptedFileError,
    ExtractionError,
    FileTooLargeError,
    LLMParsingError,
    UnsupportedFileTypeError,
)

__all__ = [
    "AppError",
    "CorruptedFileError",
    "ExtractionError",
    "FileTooLargeError",
    "LLMParsingError",
    "UnsupportedFileTypeError",
]
