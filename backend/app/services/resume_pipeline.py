"""End-to-end resume processing pipeline."""

import logging
import time
from pathlib import Path

from fastapi import UploadFile

from app.config import Settings
from app.exceptions import FileTooLargeError
from app.models.schemas import FileType, ProcessingMetadata, ResumeParseResponse
from app.services.llm_parser import LLMResumeParser
from app.services.resume_normalizer import ResumeNormalizer
from app.services.text_extraction import TextExtractor
from app.services.text_preprocessing import TextPreprocessor
from app.utils.file_detection import detect_file_type

logger = logging.getLogger(__name__)


class ResumePipelineService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._extractor = TextExtractor()
        self._preprocessor = TextPreprocessor()
        self._parser = LLMResumeParser(settings)
        self._normalizer = ResumeNormalizer()

    async def process_upload(self, upload: UploadFile) -> ResumeParseResponse:
        started = time.perf_counter()
        filename = upload.filename or "resume"
        content_type = upload.content_type

        file_type = detect_file_type(filename, content_type)
        file_bytes = await self._read_upload(upload)

        logger.info(
            "Processing resume upload",
            extra={
                "extra_fields": {
                    "filename": filename,
                    "file_type": file_type.value,
                    "size_bytes": len(file_bytes),
                }
            },
        )

        raw_text, extraction_method = await self._extractor.extract(
            file_bytes, file_type, filename
        )
        cleaned_text, warnings = self._preprocessor.clean(raw_text)
        parsed = await self._parser.parse(cleaned_text)
        standard = self._normalizer.to_standard_format(
            parsed,
            source_file=filename,
            file_type=file_type,
            warnings=warnings,
        )

        elapsed_ms = int((time.perf_counter() - started) * 1000)
        metadata = ProcessingMetadata(
            file_name=filename,
            file_type=file_type,
            file_size_bytes=len(file_bytes),
            extraction_method=extraction_method,
            text_length=len(cleaned_text),
            processing_time_ms=elapsed_ms,
            llm_model=self._settings.groq_model,
            warnings=warnings,
        )

        logger.info(
            "Resume processing completed",
            extra={
                "extra_fields": {
                    "filename": filename,
                    "processing_time_ms": elapsed_ms,
                    "completeness": standard.metadata.get("completeness_score"),
                }
            },
        )

        return ResumeParseResponse(
            parsed_resume=parsed,
            standard_format=standard,
            metadata=metadata,
        )

    async def _read_upload(self, upload: UploadFile) -> bytes:
        max_bytes = self._settings.max_upload_size_mb * 1024 * 1024
        chunks: list[bytes] = []
        total = 0

        while True:
            chunk = await upload.read(1024 * 1024)
            if not chunk:
                break
            total += len(chunk)
            if total > max_bytes:
                raise FileTooLargeError(
                    f"File exceeds maximum allowed size of {self._settings.max_upload_size_mb} MB.",
                    details={"max_upload_size_mb": self._settings.max_upload_size_mb},
                )
            chunks.append(chunk)

        if not chunks:
            raise FileTooLargeError("Uploaded file is empty.")

        ext = Path(upload.filename or "").suffix.lower()
        if ext and ext not in self._settings.allowed_extensions:
            from app.exceptions import UnsupportedFileTypeError

            raise UnsupportedFileTypeError(
                f"File extension '{ext}' is not allowed.",
                details={"allowed_extensions": self._settings.allowed_extensions},
            )

        return b"".join(chunks)
