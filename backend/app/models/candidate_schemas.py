"""Extended schemas for candidates and dashboard."""

from datetime import datetime
from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator

from app.models.schemas import ParsedResume, ProcessingMetadata, StandardResumeTemplate
from app.models.communication_schemas import CommunicationStatus

POSITION_FALLBACK = "Not Specified"

LEGACY_STATUS_MAP: dict[str, str] = {
    "parsed": "screening",
    "hired": "selected",
}


class InterviewStatus(str, Enum):
    NEW = "new"
    SCREENING = "screening"
    SHORTLISTED = "shortlisted"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    INTERVIEWED = "interviewed"
    SELECTED = "selected"
    REJECTED = "rejected"
    ON_HOLD = "on_hold"


class ParsingStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class InterviewTimelineEntry(BaseModel):
    status: InterviewStatus
    note: str | None = None
    updated_by: str | None = None
    updated_at: datetime

    @field_validator("status", mode="before")
    @classmethod
    def normalize_legacy_status(cls, value: Any) -> Any:
        if isinstance(value, str) and value in LEGACY_STATUS_MAP:
            return LEGACY_STATUS_MAP[value]
        return value


class CandidateRecord(BaseModel):
    id: str
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    position_applied: str | None = None
    total_experience_years: float | None = None
    interview_status: InterviewStatus = InterviewStatus.NEW
    communication_status: CommunicationStatus = CommunicationStatus.NO_COMMUNICATION
    parsing_status: ParsingStatus = ParsingStatus.PENDING
    recruiter_name: str = "Unassigned"
    resume_score: float | None = None
    upload_date: datetime
    file_name: str
    file_path: str
    file_type: str
    parsed_resume: ParsedResume | None = None
    standard_format: StandardResumeTemplate | None = None
    metadata: ProcessingMetadata | None = None
    parsing_error: str | None = None
    recruiter_notes: str = ""
    interview_timeline: list[InterviewTimelineEntry] = Field(default_factory=list)

    @field_validator("interview_status", mode="before")
    @classmethod
    def normalize_legacy_status(cls, value: Any) -> Any:
        if isinstance(value, str) and value in LEGACY_STATUS_MAP:
            return LEGACY_STATUS_MAP[value]
        return value


class CandidateSummary(BaseModel):
    id: str
    full_name: str | None = None
    email: str | None = None
    position_applied: str | None = None
    total_experience_years: float | None = None
    interview_status: InterviewStatus
    communication_status: CommunicationStatus = CommunicationStatus.NO_COMMUNICATION
    parsing_status: ParsingStatus
    recruiter_name: str
    resume_score: float | None = None
    upload_date: datetime

    @field_validator("interview_status", mode="before")
    @classmethod
    def normalize_legacy_status(cls, value: Any) -> Any:
        if isinstance(value, str) and value in LEGACY_STATUS_MAP:
            return LEGACY_STATUS_MAP[value]
        return value


class CandidateDetailResponse(BaseModel):
    success: bool = True
    candidate: CandidateRecord


class CandidateListResponse(BaseModel):
    success: bool = True
    items: list[CandidateSummary]
    total: int
    page: int
    page_size: int
    total_pages: int


class CandidateUploadResult(BaseModel):
    file_name: str
    success: bool
    candidate_id: str | None = None
    parsing_status: ParsingStatus
    error: str | None = None


class CandidateUploadResponse(BaseModel):
    success: bool = True
    results: list[CandidateUploadResult]


class UpdateStatusRequest(BaseModel):
    interview_status: InterviewStatus
    note: str | None = None
    recruiter_name: str | None = None


class UpdateNotesRequest(BaseModel):
    recruiter_notes: str


class DashboardMetrics(BaseModel):
    total_uploaded: int
    successfully_parsed: int
    failed_parsing: int
    shortlisted: int
    rejected: int
    interview_scheduled: int
    active_recruiters: int
    recent_uploads: list[CandidateSummary]
    status_distribution: list[dict[str, Any]]
    uploads_by_day: list[dict[str, Any]]


class DashboardResponse(BaseModel):
    success: bool = True
    metrics: DashboardMetrics


class CandidateQueryParams(BaseModel):
    page: int = 1
    page_size: int = 10
    search: str = ""
    status: InterviewStatus | None = None
    role: str | None = None
    sort_by: Literal[
        "full_name",
        "email",
        "position_applied",
        "total_experience_years",
        "interview_status",
        "recruiter_name",
        "resume_score",
        "upload_date",
    ] = "upload_date"
    sort_order: Literal["asc", "desc"] = "desc"
