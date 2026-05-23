"""Generic JSON-backed repository base."""

import asyncio
import json
import logging
from pathlib import Path
from typing import Generic, TypeVar
from uuid import uuid4

from pydantic import BaseModel

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


class JsonRepository(Generic[T]):
    model_class: type[T]
    id_field: str = "id"

    def __init__(self, data_file: Path) -> None:
        self._data_file = data_file
        self._records: dict[str, T] = {}
        self._lock = asyncio.Lock()
        self._data_file.parent.mkdir(parents=True, exist_ok=True)
        self._load()

    def _load(self) -> None:
        if not self._data_file.exists():
            return
        try:
            raw = json.loads(self._data_file.read_text(encoding="utf-8"))
            for item in raw:
                record = self.model_class.model_validate(item)
                record_id = getattr(record, self.id_field)
                self._records[record_id] = record
        except Exception as exc:
            logger.warning("Failed to load %s", self._data_file, exc_info=exc)

    async def _persist(self) -> None:
        payload = [r.model_dump(mode="json") for r in self._records.values()]
        await asyncio.to_thread(
            self._data_file.write_text,
            json.dumps(payload, indent=2, default=str),
            encoding="utf-8",
        )

    async def create(self, record: T) -> T:
        async with self._lock:
            record_id = getattr(record, self.id_field)
            self._records[record_id] = record
            await self._persist()
            return record

    async def update(self, record: T) -> T:
        async with self._lock:
            record_id = getattr(record, self.id_field)
            if record_id not in self._records:
                raise KeyError(record_id)
            self._records[record_id] = record
            await self._persist()
            return record

    async def get(self, record_id: str) -> T | None:
        async with self._lock:
            return self._records.get(record_id)

    async def list_all(self) -> list[T]:
        async with self._lock:
            return list(self._records.values())

    async def list_by_candidate(self, candidate_id: str) -> list[T]:
        records = await self.list_all()
        return [r for r in records if getattr(r, "candidate_id", None) == candidate_id]

    @staticmethod
    def new_id() -> str:
        return str(uuid4())
