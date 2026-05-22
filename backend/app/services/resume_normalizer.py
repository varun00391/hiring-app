"""Map parsed resume data into a standard company template."""

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from app.models.schemas import FileType, ParsedResume, StandardResumeTemplate


class ResumeNormalizer:
    """Normalize and map parsed resume into company-standard format."""

    def to_standard_format(
        self,
        parsed: ParsedResume,
        *,
        source_file: str,
        file_type: FileType,
        warnings: list[str] | None = None,
    ) -> StandardResumeTemplate:
        return StandardResumeTemplate(
            candidate_id=str(uuid4()),
            generated_at=datetime.now(timezone.utc),
            source_file=source_file,
            file_type=file_type,
            profile=self._build_profile(parsed),
            contact=self._build_contact(parsed),
            professional_summary=parsed.summary,
            total_experience=self._build_total_experience(parsed),
            skills_matrix=self._build_skills_matrix(parsed),
            work_history=[self._map_experience(item) for item in parsed.experience],
            education_history=[self._map_education(item) for item in parsed.education],
            certifications=[self._map_certification(item) for item in parsed.certifications],
            projects=[self._map_project(item) for item in parsed.projects],
            achievements=[self._map_achievement(item) for item in parsed.achievements],
            metadata={
                "schema_version": "1.0",
                "warnings": warnings or [],
                "completeness_score": self._compute_completeness(parsed),
            },
        )

    @staticmethod
    def _build_profile(parsed: ParsedResume) -> dict[str, Any]:
        return {
            "full_name": parsed.full_name,
            "current_company": parsed.current_company,
            "location": parsed.location,
            "headline": parsed.summary,
        }

    @staticmethod
    def _build_contact(parsed: ParsedResume) -> dict[str, Any]:
        return {
            "email": str(parsed.email) if parsed.email else None,
            "phone": parsed.phone,
            "linkedin": parsed.linkedin,
            "github": parsed.github,
        }

    @staticmethod
    def _build_total_experience(parsed: ParsedResume) -> dict[str, Any]:
        return {
            "years": parsed.total_experience_years,
            "display": (
                f"{parsed.total_experience_years:.1f} years"
                if parsed.total_experience_years is not None
                else None
            ),
            "current_company": parsed.current_company,
        }

    @staticmethod
    def _build_skills_matrix(parsed: ParsedResume) -> dict[str, list[str]]:
        all_skills = sorted(set(parsed.skills + parsed.technical_skills + parsed.soft_skills))
        return {
            "all_skills": all_skills,
            "technical_skills": parsed.technical_skills or parsed.skills,
            "soft_skills": parsed.soft_skills,
            "languages": [
                f"{lang.language} ({lang.proficiency})"
                if lang.language and lang.proficiency
                else (lang.language or lang.proficiency or "")
                for lang in parsed.languages
                if lang.language or lang.proficiency
            ],
        }

    @staticmethod
    def _map_experience(item: Any) -> dict[str, Any]:
        return {
            "company": item.company,
            "title": item.title,
            "location": item.location,
            "duration": {
                "start": item.start_date,
                "end": item.end_date,
                "is_current": item.is_current,
            },
            "summary": item.description,
            "highlights": item.highlights,
        }

    @staticmethod
    def _map_education(item: Any) -> dict[str, Any]:
        return {
            "institution": item.institution,
            "degree": item.degree,
            "field_of_study": item.field_of_study,
            "duration": {"start": item.start_date, "end": item.end_date},
            "grade": item.grade,
            "notes": item.description,
        }

    @staticmethod
    def _map_certification(item: Any) -> dict[str, Any]:
        return {
            "name": item.name,
            "issuer": item.issuer,
            "date": item.date,
            "credential_id": item.credential_id,
            "url": item.url,
        }

    @staticmethod
    def _map_project(item: Any) -> dict[str, Any]:
        return {
            "name": item.name,
            "description": item.description,
            "technologies": item.technologies,
            "url": item.url,
            "duration": {"start": item.start_date, "end": item.end_date},
            "highlights": item.highlights,
        }

    @staticmethod
    def _map_achievement(item: Any) -> dict[str, Any]:
        return {
            "title": item.title,
            "description": item.description,
            "date": item.date,
        }

    @staticmethod
    def _compute_completeness(parsed: ParsedResume) -> float:
        checks = [
            bool(parsed.full_name),
            bool(parsed.email or parsed.phone),
            bool(parsed.experience),
            bool(parsed.education),
            bool(parsed.skills or parsed.technical_skills),
            parsed.total_experience_years is not None,
            bool(parsed.location),
        ]
        return round(sum(checks) / len(checks), 2)
