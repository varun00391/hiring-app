"""Dashboard analytics aggregation."""

from collections import Counter
from datetime import datetime, timedelta, timezone

from app.models.candidate_schemas import (
    DashboardMetrics,
    DashboardResponse,
    InterviewStatus,
    ParsingStatus,
)
from app.repositories.candidate_repository import CandidateRepository


class DashboardService:
    def __init__(self, repository: CandidateRepository) -> None:
        self._repo = repository

    async def get_metrics(self) -> DashboardResponse:
        records = await self._repo.list_all()

        successfully_parsed = sum(1 for r in records if r.parsing_status == ParsingStatus.COMPLETED)
        failed_parsing = sum(1 for r in records if r.parsing_status == ParsingStatus.FAILED)
        shortlisted = sum(1 for r in records if r.interview_status == InterviewStatus.SHORTLISTED)
        rejected = sum(1 for r in records if r.interview_status == InterviewStatus.REJECTED)
        interview_scheduled = sum(
            1 for r in records if r.interview_status == InterviewStatus.INTERVIEW_SCHEDULED
        )

        recruiters = {r.recruiter_name for r in records if r.recruiter_name}
        status_counter = Counter(r.interview_status.value for r in records)
        status_distribution = [
            {"status": status, "count": count}
            for status, count in sorted(status_counter.items())
        ]

        uploads_by_day = self._build_uploads_by_day(records)
        recent = sorted(records, key=lambda r: r.upload_date, reverse=True)[:8]

        metrics = DashboardMetrics(
            total_uploaded=len(records),
            successfully_parsed=successfully_parsed,
            failed_parsing=failed_parsing,
            shortlisted=shortlisted,
            rejected=rejected,
            interview_scheduled=interview_scheduled,
            active_recruiters=len(recruiters),
            recent_uploads=[CandidateRepository.to_summary(r) for r in recent],
            status_distribution=status_distribution,
            uploads_by_day=uploads_by_day,
        )
        return DashboardResponse(metrics=metrics)

    @staticmethod
    def _build_uploads_by_day(records: list) -> list[dict]:
        today = datetime.now(timezone.utc).date()
        days = [(today - timedelta(days=i)) for i in range(6, -1, -1)]
        counter: Counter[str] = Counter()

        for record in records:
            day = record.upload_date.date().isoformat()
            counter[day] += 1

        return [
            {
                "date": day.isoformat(),
                "label": day.strftime("%a"),
                "count": counter.get(day.isoformat(), 0),
            }
            for day in days
        ]
