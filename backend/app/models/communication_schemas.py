"""Communication, interview, and activity timeline schemas."""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, EmailStr, Field


class CommunicationStatus(str, Enum):
    NO_COMMUNICATION = "no_communication"
    EMAIL_SENT = "email_sent"
    AWAITING_REPLY = "awaiting_reply"
    CANDIDATE_REPLIED = "candidate_replied"
    FOLLOW_UP_SENT = "follow_up_sent"
    MEETING_CONFIRMED = "meeting_confirmed"
    CLOSED = "closed"


class EmailDirection(str, Enum):
    SENT = "sent"
    RECEIVED = "received"


class MeetingMode(str, Enum):
    GOOGLE_MEET = "google_meet"
    ZOOM = "zoom"
    MICROSOFT_TEAMS = "microsoft_teams"
    OFFLINE = "offline"


class ActivityEventType(str, Enum):
    RESUME_UPLOADED = "resume_uploaded"
    RESUME_PARSED = "resume_parsed"
    RECRUITER_ASSIGNED = "recruiter_assigned"
    EMAIL_SENT = "email_sent"
    EMAIL_RECEIVED = "email_received"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    INTERVIEW_CONFIRMED = "interview_confirmed"
    FEEDBACK_ADDED = "feedback_added"
    STATUS_CHANGED = "status_changed"
    NOTES_UPDATED = "notes_updated"
    COMMUNICATION_STATUS_CHANGED = "communication_status_changed"


class CommunicationLogRecord(BaseModel):
    id: str
    candidate_id: str
    subject: str
    body: str
    direction: EmailDirection
    sender: str | None = None
    recipient: str | None = None
    template_key: str | None = None
    timestamp: datetime
    metadata: dict[str, Any] = Field(default_factory=dict)


class InterviewRecord(BaseModel):
    id: str
    candidate_id: str
    interview_type: str
    interviewer_name: str
    meeting_mode: MeetingMode
    scheduled_at: datetime
    duration_minutes: int = 60
    notes: str | None = None
    meeting_link: str | None = None
    location: str | None = None
    created_at: datetime
    confirmed: bool = False


class ActivityTimelineRecord(BaseModel):
    id: str
    candidate_id: str
    event_type: ActivityEventType
    description: str
    actor: str | None = None
    timestamp: datetime
    metadata: dict[str, Any] = Field(default_factory=dict)


class SendEmailRequest(BaseModel):
    candidate_id: str
    to_email: EmailStr | None = None
    subject: str
    body: str
    template_key: str | None = None
    include_signature: bool = True


class SendEmailResponse(BaseModel):
    success: bool = True
    email: CommunicationLogRecord
    communication_status: CommunicationStatus


class EmailListResponse(BaseModel):
    success: bool = True
    emails: list[CommunicationLogRecord]


class ScheduleInterviewRequest(BaseModel):
    candidate_id: str
    interview_type: str
    scheduled_date: str
    scheduled_time: str
    duration_minutes: int = 60
    interviewer_name: str
    meeting_mode: MeetingMode
    notes: str | None = None
    location: str | None = None
    send_email_invite: bool = True


class ScheduleInterviewResponse(BaseModel):
    success: bool = True
    interview: InterviewRecord
    communication_status: CommunicationStatus
    hiring_status: str


class InterviewListResponse(BaseModel):
    success: bool = True
    interviews: list[InterviewRecord]


class ActivityTimelineResponse(BaseModel):
    success: bool = True
    events: list[ActivityTimelineRecord]


class UpdateCommunicationStatusRequest(BaseModel):
    communication_status: CommunicationStatus
    note: str | None = None


EMAIL_TEMPLATES: dict[str, dict[str, str]] = {
    "initial_screening": {
        "subject": "Initial Screening — {company}",
        "body": (
            "Hi {candidate_name},\n\n"
            "Thank you for your interest in the {role} position. "
            "We would like to schedule an initial screening conversation.\n\n"
            "Please share your availability for a 30-minute call this week.\n\n"
            "Best regards,"
        ),
    },
    "interview_invitation": {
        "subject": "Interview Invitation — {role}",
        "body": (
            "Hi {candidate_name},\n\n"
            "We were impressed with your profile and would like to invite you "
            "for an interview for the {role} position.\n\n"
            "Please confirm your availability.\n\n"
            "Best regards,"
        ),
    },
    "follow_up": {
        "subject": "Follow-up — {role} Application",
        "body": (
            "Hi {candidate_name},\n\n"
            "Following up on our previous conversation regarding the {role} role. "
            "Please let us know if you have any questions.\n\n"
            "Best regards,"
        ),
    },
    "rejection": {
        "subject": "Update on Your Application — {company}",
        "body": (
            "Hi {candidate_name},\n\n"
            "Thank you for taking the time to apply for the {role} position. "
            "After careful consideration, we will not be moving forward at this time.\n\n"
            "We wish you the best in your job search.\n\n"
            "Best regards,"
        ),
    },
    "offer_discussion": {
        "subject": "Offer Discussion — {role}",
        "body": (
            "Hi {candidate_name},\n\n"
            "We are pleased to move forward with an offer discussion for the {role} position. "
            "Please let us know a convenient time to connect.\n\n"
            "Best regards,"
        ),
    },
}
