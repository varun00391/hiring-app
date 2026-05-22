"""Pydantic schemas for resume parsing API."""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, EmailStr, Field


class FileType(str, Enum):
    PDF = "pdf"
    DOC = "doc"
    DOCX = "docx"


class ExperienceEntry(BaseModel):
    company: str | None = None
    title: str | None = None
    location: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    is_current: bool = False
    description: str | None = None
    highlights: list[str] = Field(default_factory=list)


class EducationEntry(BaseModel):
    institution: str | None = None
    degree: str | None = None
    field_of_study: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    grade: str | None = None
    description: str | None = None


class CertificationEntry(BaseModel):
    name: str | None = None
    issuer: str | None = None
    date: str | None = None
    credential_id: str | None = None
    url: str | None = None


class ProjectEntry(BaseModel):
    name: str | None = None
    description: str | None = None
    technologies: list[str] = Field(default_factory=list)
    url: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    highlights: list[str] = Field(default_factory=list)


class AchievementEntry(BaseModel):
    title: str | None = None
    description: str | None = None
    date: str | None = None


class LanguageEntry(BaseModel):
    language: str | None = None
    proficiency: str | None = None


class ParsedResume(BaseModel):
    """Normalized resume schema returned by the parser."""

    full_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    location: str | None = None
    linkedin: str | None = None
    github: str | None = None
    current_company: str | None = None
    total_experience_years: float | None = None
    summary: str | None = None

    skills: list[str] = Field(default_factory=list)
    technical_skills: list[str] = Field(default_factory=list)
    soft_skills: list[str] = Field(default_factory=list)
    languages: list[LanguageEntry] = Field(default_factory=list)

    experience: list[ExperienceEntry] = Field(default_factory=list)
    education: list[EducationEntry] = Field(default_factory=list)
    certifications: list[CertificationEntry] = Field(default_factory=list)
    projects: list[ProjectEntry] = Field(default_factory=list)
    achievements: list[AchievementEntry] = Field(default_factory=list)


class StandardResumeTemplate(BaseModel):
    """Company-standard resume format mapped from parsed data."""

    candidate_id: str | None = None
    generated_at: datetime
    source_file: str
    file_type: FileType

    profile: dict[str, Any]
    contact: dict[str, Any]
    professional_summary: str | None = None
    total_experience: dict[str, Any]
    skills_matrix: dict[str, list[str]]
    work_history: list[dict[str, Any]]
    education_history: list[dict[str, Any]]
    certifications: list[dict[str, Any]]
    projects: list[dict[str, Any]]
    achievements: list[dict[str, Any]]
    metadata: dict[str, Any] = Field(default_factory=dict)


class ProcessingMetadata(BaseModel):
    file_name: str
    file_type: FileType
    file_size_bytes: int
    extraction_method: str
    text_length: int
    processing_time_ms: int
    llm_model: str
    warnings: list[str] = Field(default_factory=list)


class ResumeParseResponse(BaseModel):
    success: bool = True
    parsed_resume: ParsedResume
    standard_format: StandardResumeTemplate
    metadata: ProcessingMetadata


class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str


class ErrorResponse(BaseModel):
    success: bool = False
    error: dict[str, Any]
