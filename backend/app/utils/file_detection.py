"""File type detection utilities."""

import mimetypes
from pathlib import Path

from app.exceptions import UnsupportedFileTypeError
from app.models.schemas import FileType

EXTENSION_MAP: dict[str, FileType] = {
    ".pdf": FileType.PDF,
    ".doc": FileType.DOC,
    ".docx": FileType.DOCX,
}

MIME_MAP: dict[str, FileType] = {
    "application/pdf": FileType.PDF,
    "application/msword": FileType.DOC,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": FileType.DOCX,
}


def detect_file_type(filename: str, content_type: str | None = None) -> FileType:
    """Detect resume file type from extension and optional MIME type."""
    ext = Path(filename).suffix.lower()
    if ext in EXTENSION_MAP:
        return EXTENSION_MAP[ext]

    if content_type and content_type in MIME_MAP:
        return MIME_MAP[content_type]

    guessed, _ = mimetypes.guess_type(filename)
    if guessed and guessed in MIME_MAP:
        return MIME_MAP[guessed]

    raise UnsupportedFileTypeError(
        f"Unsupported file type: {ext or content_type or 'unknown'}",
        details={"filename": filename, "content_type": content_type},
    )
