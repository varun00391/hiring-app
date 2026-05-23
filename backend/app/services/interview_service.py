"""Interview scheduling service."""

import logging
from datetime import datetime, timezone

from app.config import Settings
from app.exceptions import CandidateNotFoundError
from app.models.candidate_schemas import InterviewStatus
from app.models.communication_schemas import (
    ActivityEventType,
    CommunicationStatus,
    InterviewRecord,
    InterviewListResponse,
    MeetingMode,
    ScheduleInterviewRequest,
    ScheduleInterviewResponse,
    SendEmailRequest,
)
from app.repositories.candidate_repository import CandidateRepository
from app.repositories.interview_repository import InterviewRepository
from app.services.calendar_service import CalendarService
from app.services.communication_service import CommunicationService
from app.services.timeline_service import TimelineService

logger = logging.getLogger(__name__)


class InterviewService:
    def __init__(
        self,
        settings: Settings,
        candidate_repo: CandidateRepository,
        interview_repo: InterviewRepository,
        calendar_service: CalendarService,
        communication_service: CommunicationService,
        timeline_service: TimelineService,
    ) -> None:
        self._settings = settings
        self._candidates = candidate_repo
        self._interviews = interview_repo
        self._calendar = calendar_service
        self._communication = communication_service
        self._timeline = timeline_service

    async def schedule_interview(self, payload: ScheduleInterviewRequest) -> ScheduleInterviewResponse:
        candidate = await self._candidates.get(payload.candidate_id)
        if not candidate:
            raise CandidateNotFoundError(
                "Candidate not found.",
                details={"candidate_id": payload.candidate_id},
            )

        scheduled_at = datetime.fromisoformat(
            f"{payload.scheduled_date}T{payload.scheduled_time}"
        ).replace(tzinfo=timezone.utc)

        interview_id = InterviewRepository.new_id()
        meeting_link = self._calendar.generate_meeting_link(interview_id, payload.meeting_mode)

        interview = InterviewRecord(
            id=interview_id,
            candidate_id=candidate.id,
            interview_type=payload.interview_type,
            interviewer_name=payload.interviewer_name,
            meeting_mode=payload.meeting_mode,
            scheduled_at=scheduled_at,
            duration_minutes=payload.duration_minutes,
            notes=payload.notes,
            meeting_link=meeting_link,
            location=payload.location,
            created_at=datetime.now(timezone.utc),
        )
        await self._interviews.create(interview)
        self._calendar.create_internal_event(interview)

        candidate.interview_status = InterviewStatus.INTERVIEW_SCHEDULED
        candidate.communication_status = CommunicationStatus.EMAIL_SENT
        await self._candidates.update(candidate)

        await self._timeline.log_event(
            candidate_id=candidate.id,
            event_type=ActivityEventType.INTERVIEW_SCHEDULED,
            description=(
                f"Interview scheduled: {payload.interview_type} on "
                f"{scheduled_at.strftime('%b %d, %Y %I:%M %p UTC')}"
            ),
            actor=candidate.recruiter_name,
            metadata={"interview_id": interview.id, "meeting_mode": payload.meeting_mode.value},
        )

        if payload.send_email_invite and candidate.email:
            invite_body = self._calendar.build_interview_invite_body(
                candidate_name=candidate.full_name or "Candidate",
                role=candidate.position_applied or "the open role",
                interview=interview,
            )
            await self._communication.send_email(
                SendEmailRequest(
                    candidate_id=candidate.id,
                    subject=f"Interview Invitation — {payload.interview_type}",
                    body=invite_body,
                    template_key="interview_invitation",
                )
            )
            candidate.communication_status = CommunicationStatus.AWAITING_REPLY
            await self._candidates.update(candidate)

        return ScheduleInterviewResponse(
            interview=interview,
            communication_status=candidate.communication_status,
            hiring_status=candidate.interview_status.value,
        )

    async def list_candidate_interviews(self, candidate_id: str) -> InterviewListResponse:
        if not await self._candidates.get(candidate_id):
            raise CandidateNotFoundError("Candidate not found.", details={"candidate_id": candidate_id})
        interviews = await self._interviews.list_for_candidate(candidate_id)
        return InterviewListResponse(interviews=interviews)

    async def confirm_interview(self, interview_id: str) -> InterviewRecord:
        interview = await self._interviews.get(interview_id)
        if not interview:
            raise CandidateNotFoundError("Interview not found.", details={"interview_id": interview_id})

        interview.confirmed = True
        await self._interviews.update(interview)

        candidate = await self._candidates.get(interview.candidate_id)
        if candidate:
            candidate.communication_status = CommunicationStatus.MEETING_CONFIRMED
            await self._candidates.update(candidate)
            await self._timeline.log_event(
                candidate_id=candidate.id,
                event_type=ActivityEventType.INTERVIEW_CONFIRMED,
                description="Interview confirmed",
                actor=candidate.recruiter_name,
                metadata={"interview_id": interview.id},
            )
        return interview
