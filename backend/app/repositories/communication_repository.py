"""Communication log persistence."""

from pathlib import Path

from app.models.communication_schemas import CommunicationLogRecord
from app.repositories.base_repository import JsonRepository


class CommunicationRepository(JsonRepository[CommunicationLogRecord]):
    model_class = CommunicationLogRecord

    def __init__(self, data_file: Path) -> None:
        super().__init__(data_file)

    async def list_for_candidate(self, candidate_id: str) -> list[CommunicationLogRecord]:
        records = await self.list_by_candidate(candidate_id)
        return sorted(records, key=lambda r: r.timestamp, reverse=True)
