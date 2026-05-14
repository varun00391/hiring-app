"""Asynchronous resume text extraction pipeline."""

from __future__ import annotations

import logging
from pathlib import Path
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.database.session import AsyncSessionLocal
from app.models import Candidate, ExtractionStatus, Resume
from app.repositories.candidate_repository import add_activity
from app.utils.resume_parse import parse_resume
from app.utils.resume_text import ResumeTextError, docx_to_text, pdf_to_text

logger = logging.getLogger(__name__)


async def run_resume_extraction(resume_id: UUID) -> None:
    async with AsyncSessionLocal() as session:
        resume = (
            await session.execute(select(Resume).where(Resume.id == resume_id).options(joinedload(Resume.candidate)))
        ).scalar_one_or_none()
        if not resume or not resume.candidate:
            logger.warning("Resume %s not found", resume_id)
            return

        resume.extraction_status = ExtractionStatus.processing
        session.add(resume)
        await session.commit()

        try:
            candidate: Candidate = resume.candidate
            data = Path(resume.file_path).read_bytes()
            mime = resume.mime_type.lower()
            if "pdf" in mime:
                text = await pdf_to_text(data)
            elif "wordprocessingml" in mime or "msword" in mime:
                text = await docx_to_text(data)
            else:
                raise ResumeTextError("Unsupported MIME type")

            parsed = parse_resume(text)

            resume.extraction_status = ExtractionStatus.completed
            resume.error_message = None
            resume.parsed_payload = {"raw_preview": text[:4000]}
            candidate.full_name = parsed.get("full_name") or candidate.full_name
            candidate.email = parsed.get("email") or candidate.email
            candidate.phone = parsed.get("phone") or candidate.phone
            candidate.linkedin_url = parsed.get("linkedin_url")
            candidate.github_url = parsed.get("github_url")
            candidate.skills = parsed.get("skills")
            candidate.certifications = parsed.get("certifications")
            candidate.education = parsed.get("education")
            candidate.work_experience = parsed.get("work_experience")
            candidate.projects = parsed.get("projects")
            candidate.ai_match_score = parsed.get("ai_match_score")
            candidate.parsed_metadata = {"pipeline": "hirebot", "confidence": "heuristic"}

            session.add(candidate)
            session.add(resume)
            await session.commit()

            await add_activity(
                session,
                candidate_id=candidate.id,
                actor_id=None,
                action="resume_parsed",
                details={"resume_id": str(resume_id)},
            )
            await session.commit()
        except ResumeTextError as exc:
            await _mark_failure(session, resume_id, str(exc))
        except Exception:
            logger.exception("Resume extraction failed")
            await _mark_failure(session, resume_id, "Unexpected extraction error")


async def _mark_failure(session, resume_id: UUID, message: str) -> None:
    resume = (await session.execute(select(Resume).where(Resume.id == resume_id))).scalar_one_or_none()
    if not resume:
        return
    resume.extraction_status = ExtractionStatus.failed
    resume.error_message = message
    session.add(resume)
    await session.commit()
