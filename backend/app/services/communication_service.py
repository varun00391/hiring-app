"""Candidate communication orchestration."""

import logging
import re
from datetime import datetime, timezone

from app.config import Settings
from app.exceptions import CandidateNotFoundError, EmailSendError
from app.models.communication_schemas import (
    ActivityEventType,
    CommunicationLogRecord,
    CommunicationStatus,
    EmailDirection,
    EmailListResponse,
    SendEmailRequest,
    SendEmailResponse,
    UpdateCommunicationStatusRequest,
)
from app.repositories.candidate_repository import CandidateRepository
from app.repositories.communication_repository import CommunicationRepository
from app.services.email_service import EmailService
from app.services.timeline_service import TimelineService

logger = logging.getLogger(__name__)

CONFIRMATION_KEYWORDS = re.compile(
    r"\b(confirm|confirmed|yes|available|accept|looking forward|see you)\b",
    re.IGNORECASE,
)


class CommunicationService:
    def __init__(
        self,
        settings: Settings,
        candidate_repo: CandidateRepository,
        communication_repo: CommunicationRepository,
        email_service: EmailService,
        timeline_service: TimelineService,
    ) -> None:
        self._settings = settings
        self._candidates = candidate_repo
        self._communications = communication_repo
        self._email = email_service
        self._timeline = timeline_service

    async def send_email(self, payload: SendEmailRequest) -> SendEmailResponse:
        candidate = await self._candidates.get(payload.candidate_id)
        if not candidate:
            raise CandidateNotFoundError(
                "Candidate not found.",
                details={"candidate_id": payload.candidate_id},
            )

        to_email = str(payload.to_email or candidate.email or "")
        if not to_email:
            raise EmailSendError("Candidate does not have an email address on file.")

        delivery = await self._email.send_email(
            to_email=to_email,
            subject=payload.subject,
            body=payload.body,
            include_signature=payload.include_signature,
        )

        log = CommunicationLogRecord(
            id=CommunicationRepository.new_id(),
            candidate_id=candidate.id,
            subject=payload.subject,
            body=delivery["body"],
            direction=EmailDirection.SENT,
            sender=delivery.get("from"),
            recipient=to_email,
            template_key=payload.template_key,
            timestamp=datetime.now(timezone.utc),
            metadata={"sent": delivery.get("sent"), "simulated": delivery.get("simulated")},
        )
        await self._communications.create(log)

        new_status = self._resolve_sent_status(candidate.communication_status, payload.template_key)
        candidate.communication_status = new_status
        await self._candidates.update(candidate)

        await self._timeline.log_event(
            candidate_id=candidate.id,
            event_type=ActivityEventType.EMAIL_SENT,
            description=f"Email sent: {payload.subject}",
            actor=candidate.recruiter_name,
            metadata={"email_id": log.id, "template_key": payload.template_key},
        )

        return SendEmailResponse(email=log, communication_status=new_status)

    async def list_candidate_emails(self, candidate_id: str) -> EmailListResponse:
        if not await self._candidates.get(candidate_id):
            raise CandidateNotFoundError(
                "Candidate not found.",
                details={"candidate_id": candidate_id},
            )
        emails = await self._communications.list_for_candidate(candidate_id)
        return EmailListResponse(emails=emails)

    async def record_inbound_reply(
        self,
        *,
        candidate_id: str,
        subject: str,
        body: str,
        sender: str,
    ) -> CommunicationLogRecord:
        candidate = await self._candidates.get(candidate_id)
        if not candidate:
            raise CandidateNotFoundError("Candidate not found.", details={"candidate_id": candidate_id})

        log = CommunicationLogRecord(
            id=CommunicationRepository.new_id(),
            candidate_id=candidate_id,
            subject=subject,
            body=body,
            direction=EmailDirection.RECEIVED,
            sender=sender,
            recipient=self._settings.smtp_from_email or self._settings.smtp_username,
            timestamp=datetime.now(timezone.utc),
        )
        await self._communications.create(log)

        candidate.communication_status = CommunicationStatus.CANDIDATE_REPLIED
        await self._candidates.update(candidate)

        await self._timeline.log_event(
            candidate_id=candidate_id,
            event_type=ActivityEventType.EMAIL_RECEIVED,
            description=f"Reply received: {subject}",
            actor=sender,
            metadata={"email_id": log.id},
        )

        if CONFIRMATION_KEYWORDS.search(body):
            await self._confirm_meeting_from_reply(candidate)

        return log

    async def update_communication_status(
        self,
        candidate_id: str,
        payload: UpdateCommunicationStatusRequest,
    ) -> CommunicationStatus:
        candidate = await self._candidates.get(candidate_id)
        if not candidate:
            raise CandidateNotFoundError("Candidate not found.", details={"candidate_id": candidate_id})

        candidate.communication_status = payload.communication_status
        await self._candidates.update(candidate)

        await self._timeline.log_event(
            candidate_id=candidate_id,
            event_type=ActivityEventType.COMMUNICATION_STATUS_CHANGED,
            description=f"Communication status updated to {payload.communication_status.value}",
            actor=candidate.recruiter_name,
            metadata={"note": payload.note},
        )
        return payload.communication_status

    async def _confirm_meeting_from_reply(self, candidate) -> None:
        from app.models.candidate_schemas import InterviewStatus

        candidate.communication_status = CommunicationStatus.MEETING_CONFIRMED
        if candidate.interview_status != InterviewStatus.INTERVIEW_SCHEDULED:
            candidate.interview_status = InterviewStatus.INTERVIEW_SCHEDULED
        await self._candidates.update(candidate)

        await self._timeline.log_event(
            candidate_id=candidate.id,
            event_type=ActivityEventType.INTERVIEW_CONFIRMED,
            description="Candidate confirmed meeting via email reply",
            actor=candidate.full_name,
        )

    @staticmethod
    def _resolve_sent_status(
        current: CommunicationStatus,
        template_key: str | None,
    ) -> CommunicationStatus:
        if template_key == "follow_up":
            return CommunicationStatus.FOLLOW_UP_SENT
        if template_key == "rejection":
            return CommunicationStatus.CLOSED
        if current in {CommunicationStatus.NO_COMMUNICATION, CommunicationStatus.CANDIDATE_REPLIED}:
            return CommunicationStatus.AWAITING_REPLY
        return CommunicationStatus.EMAIL_SENT
