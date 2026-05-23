"""Persist uploaded resume files to disk."""

import asyncio
import logging
from pathlib import Path
from uuid import uuid4

from app.config import Settings

logger = logging.getLogger(__name__)


class FileStorageService:
    def __init__(self, settings: Settings) -> None:
        self._base_dir = Path(settings.upload_temp_dir)
        self._base_dir.mkdir(parents=True, exist_ok=True)

    async def save(self, file_bytes: bytes, filename: str) -> tuple[str, str]:
        candidate_dir = self._base_dir / str(uuid4())
        await asyncio.to_thread(candidate_dir.mkdir, parents=True, exist_ok=True)

        safe_name = Path(filename).name
        file_path = candidate_dir / safe_name
        await asyncio.to_thread(file_path.write_bytes, file_bytes)

        logger.info(
            "Saved resume file",
            extra={"extra_fields": {"path": str(file_path), "size": len(file_bytes)}},
        )
        return str(file_path), safe_name

    async def read(self, file_path: str) -> bytes:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Resume file not found: {file_path}")
        return await asyncio.to_thread(path.read_bytes)
