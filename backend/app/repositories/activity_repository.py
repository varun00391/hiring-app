"""Activity timeline persistence."""

from pathlib import Path

from app.models.communication_schemas import ActivityTimelineRecord
from app.repositories.base_repository import JsonRepository


class ActivityRepository(JsonRepository[ActivityTimelineRecord]):
    model_class = ActivityTimelineRecord

    def __init__(self, data_file: Path) -> None:
        super().__init__(data_file)

    async def list_for_candidate(self, candidate_id: str) -> list[ActivityTimelineRecord]:
        records = await self.list_by_candidate(candidate_id)
        return sorted(records, key=lambda r: r.timestamp, reverse=True)
