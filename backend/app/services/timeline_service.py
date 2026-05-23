"""Activity timeline logging service."""

import logging
from datetime import datetime, timezone
from typing import Any

from app.models.communication_schemas import ActivityEventType, ActivityTimelineRecord
from app.repositories.activity_repository import ActivityRepository

logger = logging.getLogger(__name__)


class TimelineService:
    def __init__(self, repository: ActivityRepository) -> None:
        self._repo = repository

    async def log_event(
        self,
        *,
        candidate_id: str,
        event_type: ActivityEventType,
        description: str,
        actor: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> ActivityTimelineRecord:
        record = ActivityTimelineRecord(
            id=ActivityRepository.new_id(),
            candidate_id=candidate_id,
            event_type=event_type,
            description=description,
            actor=actor,
            timestamp=datetime.now(timezone.utc),
            metadata=metadata or {},
        )
        await self._repo.create(record)
        logger.info(
            "Timeline event logged",
            extra={
                "extra_fields": {
                    "candidate_id": candidate_id,
                    "event_type": event_type.value,
                }
            },
        )
        return record

    async def get_candidate_timeline(self, candidate_id: str) -> list[ActivityTimelineRecord]:
        return await self._repo.list_for_candidate(candidate_id)
