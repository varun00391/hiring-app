"""Interview persistence."""

from pathlib import Path

from app.models.communication_schemas import InterviewRecord
from app.repositories.base_repository import JsonRepository


class InterviewRepository(JsonRepository[InterviewRecord]):
    model_class = InterviewRecord

    def __init__(self, data_file: Path) -> None:
        super().__init__(data_file)

    async def list_for_candidate(self, candidate_id: str) -> list[InterviewRecord]:
        records = await self.list_by_candidate(candidate_id)
        return sorted(records, key=lambda r: r.scheduled_at, reverse=True)
