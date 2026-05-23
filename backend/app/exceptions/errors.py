"""Custom exception hierarchy for resume processing."""

from typing import Any


class AppError(Exception):
    """Base application error with HTTP mapping metadata."""

    status_code: int = 500
    error_code: str = "internal_error"

    def __init__(self, message: str, *, details: dict[str, Any] | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.details = details or {}


class UnsupportedFileTypeError(AppError):
    status_code = 415
    error_code = "unsupported_file_type"


class FileTooLargeError(AppError):
    status_code = 413
    error_code = "file_too_large"


class CorruptedFileError(AppError):
    status_code = 422
    error_code = "corrupted_file"


class ExtractionError(AppError):
    status_code = 422
    error_code = "extraction_failed"


class LLMParsingError(AppError):
    status_code = 502
    error_code = "llm_parsing_failed"


class CandidateNotFoundError(AppError):
    status_code = 404
    error_code = "candidate_not_found"


class EmailSendError(AppError):
    status_code = 502
    error_code = "email_send_failed"
