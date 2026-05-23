"""In-memory candidate repository with JSON persistence."""

import asyncio
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from app.models.candidate_schemas import (
    CandidateRecord,
    CandidateSummary,
    InterviewStatus,
    InterviewTimelineEntry,
    ParsingStatus,
)
from app.models.communication_schemas import CommunicationStatus

logger = logging.getLogger(__name__)


class CandidateRepository:
    def __init__(self, data_file: str = "data/candidates.json") -> None:
        self._data_file = Path(data_file)
        self._candidates: dict[str, CandidateRecord] = {}
        self._lock = asyncio.Lock()
        self._load()

    def _load(self) -> None:
        if not self._data_file.exists():
            self._data_file.parent.mkdir(parents=True, exist_ok=True)
            return
        try:
            raw = json.loads(self._data_file.read_text(encoding="utf-8"))
            for item in raw:
                record = CandidateRecord.model_validate(item)
                self._candidates[record.id] = record
        except Exception as exc:
            logger.warning("Failed to load candidates store", exc_info=exc)

    async def _persist(self) -> None:
        payload = [c.model_dump(mode="json") for c in self._candidates.values()]
        await asyncio.to_thread(
            self._data_file.write_text,
            json.dumps(payload, indent=2, default=str),
            encoding="utf-8",
        )

    async def create(self, record: CandidateRecord) -> CandidateRecord:
        async with self._lock:
            self._candidates[record.id] = record
            await self._persist()
            return record

    async def update(self, record: CandidateRecord) -> CandidateRecord:
        async with self._lock:
            if record.id not in self._candidates:
                raise KeyError(record.id)
            self._candidates[record.id] = record
            await self._persist()
            return record

    async def get(self, candidate_id: str) -> CandidateRecord | None:
        async with self._lock:
            return self._candidates.get(candidate_id)

    async def list_all(self) -> list[CandidateRecord]:
        async with self._lock:
            return list(self._candidates.values())

    @staticmethod
    def new_id() -> str:
        return str(uuid4())

    @staticmethod
    def to_summary(record: CandidateRecord) -> CandidateSummary:
        return CandidateSummary(
            id=record.id,
            full_name=record.full_name,
            email=record.email,
            position_applied=record.position_applied,
            total_experience_years=record.total_experience_years,
            interview_status=record.interview_status,
            communication_status=getattr(
                record, "communication_status", CommunicationStatus.NO_COMMUNICATION
            ),
            parsing_status=record.parsing_status,
            recruiter_name=record.recruiter_name,
            resume_score=record.resume_score,
            upload_date=record.upload_date,
        )

    @staticmethod
    def initial_timeline(status: InterviewStatus, recruiter: str) -> list[InterviewTimelineEntry]:
        return [
            InterviewTimelineEntry(
                status=status,
                note="Candidate record created",
                updated_by=recruiter,
                updated_at=datetime.now(timezone.utc),
            )
        ]
