from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.models import CandidateStage
from app.schemas.work_email import WorkEmail


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: WorkEmail
    password: str


class RoleOut(BaseModel):
    id: UUID
    name: str

    model_config = {"from_attributes": True}


class UserOut(BaseModel):
    id: UUID
    email: WorkEmail
    full_name: str
    specialization: str | None
    role: RoleOut

    model_config = {"from_attributes": True}


class TagMemberCreate(BaseModel):
    """Admin-provisioned TAG member login (email + password chosen at creation time)."""

    email: WorkEmail
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=255)
    specialization: str | None = Field(None, max_length=255)


class CandidateCreate(BaseModel):
    full_name: str = Field(..., min_length=1)
    email: EmailStr | None = None
    applied_role: str | None = None
    phone: str | None = None
    experience_years: float | None = None


class CandidateAssignRequest(BaseModel):
    recruiter_id: UUID | None = None
    tag_member_id: UUID | None = None


class CandidateStageUpdate(BaseModel):
    stage: CandidateStage
    note: str | None = None


class CandidateUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    applied_role: str | None = None
    experience_years: float | None = None
    status: str | None = None
    interview_date: datetime | None = None


class InterviewNoteCreate(BaseModel):
    body: str = Field(..., min_length=1)


class CandidateOut(BaseModel):
    id: UUID
    public_id: str
    full_name: str
    email: str | None
    phone: str | None
    applied_role: str | None
    experience_years: float | None
    current_stage: CandidateStage
    ai_match_score: float | None
    recruiter_id: UUID | None
    assigned_tag_id: UUID | None
    recruiter_name: str | None = None
    tag_member_name: str | None = None
    interview_date: datetime | None
    status: str
    linkedin_url: str | None
    github_url: str | None
    skills: list | None = None
    certifications: list | None = None
    education: list | None = None
    work_experience: list | None = None
    projects: list | None = None
    parsed_metadata: dict | None = None
    created_at: datetime
    updated_at: datetime


class PaginatedCandidates(BaseModel):
    items: list[CandidateOut]
    total: int
    page: int
    page_size: int


class DashboardMetricCard(BaseModel):
    key: str
    title: str
    value: int


class DashboardResponse(BaseModel):
    metrics: list[DashboardMetricCard]


class PipelineStageRow(BaseModel):
    stage: str
    count: int


class PipelineResponse(BaseModel):
    stages: list[PipelineStageRow]
    total: int


class TagPerformanceRow(BaseModel):
    member_id: UUID
    member_name: str
    specialization: str | None
    assigned_candidates: int
    hired_candidates: int
    success_ratio: float
    active_positions: int


class InterviewNoteOut(BaseModel):
    id: UUID
    candidate_id: UUID
    author_id: UUID
    body: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ActivityLogOut(BaseModel):
    id: UUID
    action: str
    details: dict | None
    actor_id: UUID | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ResumeOut(BaseModel):
    id: UUID
    candidate_id: UUID
    original_filename: str
    extraction_status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class CandidateDetail(CandidateOut):
    notes: list[InterviewNoteOut] = []
    activity: list[ActivityLogOut] = []
    resumes: list[ResumeOut] = []


class UploadResultItem(BaseModel):
    filename: str
    status: str
    candidate_id: UUID | None = None
    error: str | None = None
