"""Candidate business logic and resume ingestion."""

import logging
from datetime import datetime, timezone

from fastapi import UploadFile
from fastapi.responses import Response

from app.config import Settings
from app.exceptions import CandidateNotFoundError
from app.models.candidate_schemas import (
    CandidateDetailResponse,
    CandidateListResponse,
    CandidateQueryParams,
    CandidateRecord,
    CandidateUploadResponse,
    CandidateUploadResult,
    InterviewStatus,
    InterviewTimelineEntry,
    ParsingStatus,
    UpdateNotesRequest,
    UpdateStatusRequest,
)
from app.models.communication_schemas import ActivityEventType, CommunicationStatus
from app.repositories.candidate_repository import CandidateRepository
from app.services.file_storage import FileStorageService
from app.services.resume_pipeline import ResumePipelineService
from app.services.resume_scorer import ResumeScorer
from app.services.timeline_service import TimelineService
from app.utils.resume_fields import derive_position_applied

logger = logging.getLogger(__name__)

DEFAULT_RECRUITER = "Alex Morgan"


class CandidateService:
    def __init__(
        self,
        settings: Settings,
        repository: CandidateRepository,
        pipeline: ResumePipelineService,
        storage: FileStorageService,
        scorer: ResumeScorer,
        timeline_service: TimelineService,
    ) -> None:
        self._settings = settings
        self._repo = repository
        self._pipeline = pipeline
        self._storage = storage
        self._scorer = scorer
        self._timeline = timeline_service

    async def upload_resumes(
        self,
        files: list[UploadFile],
        *,
        position_applied: str | None = None,
        recruiter_name: str | None = None,
    ) -> CandidateUploadResponse:
        recruiter = recruiter_name or DEFAULT_RECRUITER
        results: list[CandidateUploadResult] = []

        for upload in files:
            filename = upload.filename or "resume"
            candidate_id = CandidateRepository.new_id()
            record = CandidateRecord(
                id=candidate_id,
                interview_status=InterviewStatus.NEW,
                parsing_status=ParsingStatus.PROCESSING,
                recruiter_name=recruiter,
                upload_date=datetime.now(timezone.utc),
                file_name=filename,
                file_path="",
                file_type="",
                interview_timeline=CandidateRepository.initial_timeline(
                    InterviewStatus.NEW, recruiter
                ),
            )

            try:
                file_bytes = await self._pipeline._read_upload(upload)
                file_path, stored_name = await self._storage.save(file_bytes, filename)
                record.file_path = file_path
                record.file_name = stored_name

                await upload.seek(0)
                parse_result = await self._pipeline.process_upload(upload)

                parsed = parse_result.parsed_resume
                standard = parse_result.standard_format
                score = self._scorer.score(parsed, standard)

                record.full_name = parsed.full_name
                record.email = str(parsed.email) if parsed.email else None
                record.phone = parsed.phone
                record.position_applied = derive_position_applied(parsed, position_applied)
                record.total_experience_years = parsed.total_experience_years
                record.parsed_resume = parsed
                record.standard_format = standard
                record.metadata = parse_result.metadata
                record.resume_score = score
                record.file_type = parse_result.metadata.file_type.value
                record.parsing_status = ParsingStatus.COMPLETED
                record.interview_timeline.append(
                    InterviewTimelineEntry(
                        status=InterviewStatus.NEW,
                        note="Resume parsed successfully",
                        updated_by=recruiter,
                        updated_at=datetime.now(timezone.utc),
                    )
                )

                await self._repo.create(record)
                await self._timeline.log_event(
                    candidate_id=candidate_id,
                    event_type=ActivityEventType.RESUME_UPLOADED,
                    description=f"Resume uploaded: {filename}",
                    actor=recruiter,
                )
                await self._timeline.log_event(
                    candidate_id=candidate_id,
                    event_type=ActivityEventType.RESUME_PARSED,
                    description="Resume parsed successfully",
                    actor=recruiter,
                    metadata={"resume_score": score},
                )
                await self._timeline.log_event(
                    candidate_id=candidate_id,
                    event_type=ActivityEventType.RECRUITER_ASSIGNED,
                    description=f"Recruiter assigned: {recruiter}",
                    actor=recruiter,
                )
                results.append(
                    CandidateUploadResult(
                        file_name=filename,
                        success=True,
                        candidate_id=candidate_id,
                        parsing_status=ParsingStatus.COMPLETED,
                    )
                )
            except Exception as exc:
                logger.exception("Failed to process resume upload", extra={"extra_fields": {"file": filename}})
                record.parsing_status = ParsingStatus.FAILED
                record.parsing_error = str(exc)
                if record.file_path:
                    await self._repo.create(record)
                results.append(
                    CandidateUploadResult(
                        file_name=filename,
                        success=False,
                        candidate_id=record.id if record.file_path else None,
                        parsing_status=ParsingStatus.FAILED,
                        error=str(exc),
                    )
                )

        return CandidateUploadResponse(results=results)

    async def list_candidates(self, params: CandidateQueryParams) -> CandidateListResponse:
        records = await self._repo.list_all()
        filtered = self._apply_filters(records, params)
        sorted_records = self._apply_sort(filtered, params.sort_by, params.sort_order)

        total = len(sorted_records)
        page_size = max(1, min(params.page_size, 100))
        page = max(1, params.page)
        start = (page - 1) * page_size
        page_items = sorted_records[start : start + page_size]

        return CandidateListResponse(
            items=[CandidateRepository.to_summary(r) for r in page_items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=max(1, (total + page_size - 1) // page_size),
        )

    async def get_candidate(self, candidate_id: str) -> CandidateDetailResponse:
        record = await self._repo.get(candidate_id)
        if not record:
            raise CandidateNotFoundError(
                "Candidate not found.",
                details={"candidate_id": candidate_id},
            )
        return CandidateDetailResponse(candidate=record)

    async def update_status(
        self,
        candidate_id: str,
        payload: UpdateStatusRequest,
    ) -> CandidateDetailResponse:
        record = await self._repo.get(candidate_id)
        if not record:
            raise CandidateNotFoundError(
                "Candidate not found.",
                details={"candidate_id": candidate_id},
            )

        recruiter = payload.recruiter_name or record.recruiter_name
        record.interview_status = payload.interview_status
        record.recruiter_name = recruiter
        record.interview_timeline.append(
            InterviewTimelineEntry(
                status=payload.interview_status,
                note=payload.note,
                updated_by=recruiter,
                updated_at=datetime.now(timezone.utc),
            )
        )
        updated = await self._repo.update(record)
        await self._timeline.log_event(
            candidate_id=candidate_id,
            event_type=ActivityEventType.STATUS_CHANGED,
            description=f"Hiring status changed to {payload.interview_status.value}",
            actor=recruiter,
            metadata={"note": payload.note},
        )
        return CandidateDetailResponse(candidate=updated)

    async def update_notes(
        self,
        candidate_id: str,
        payload: UpdateNotesRequest,
    ) -> CandidateDetailResponse:
        record = await self._repo.get(candidate_id)
        if not record:
            raise CandidateNotFoundError(
                "Candidate not found.",
                details={"candidate_id": candidate_id},
            )
        record.recruiter_notes = payload.recruiter_notes
        updated = await self._repo.update(record)
        await self._timeline.log_event(
            candidate_id=candidate_id,
            event_type=ActivityEventType.FEEDBACK_ADDED,
            description="Recruiter notes updated",
            actor=record.recruiter_name,
        )
        return CandidateDetailResponse(candidate=updated)

    async def download_resume(self, candidate_id: str) -> Response:
        record = await self._repo.get(candidate_id)
        if not record:
            raise CandidateNotFoundError(
                "Candidate not found.",
                details={"candidate_id": candidate_id},
            )

        content = await self._storage.read(record.file_path)
        media_types = {
            "pdf": "application/pdf",
            "doc": "application/msword",
            "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }
        media_type = media_types.get(record.file_type, "application/octet-stream")

        return Response(
            content=content,
            media_type=media_type,
            headers={"Content-Disposition": f'attachment; filename="{record.file_name}"'},
        )

    @staticmethod
    def _apply_filters(
        records: list[CandidateRecord],
        params: CandidateQueryParams,
    ) -> list[CandidateRecord]:
        result = records
        if params.search:
            q = params.search.lower()
            result = [
                r
                for r in result
                if q in (r.full_name or "").lower()
                or q in (r.email or "").lower()
                or q in (r.position_applied or "").lower()
            ]
        if params.status:
            result = [r for r in result if r.interview_status == params.status]
        if params.role:
            role = params.role.lower()
            result = [r for r in result if role in (r.position_applied or "").lower()]
        return result

    @staticmethod
    def _apply_sort(
        records: list[CandidateRecord],
        sort_by: str,
        sort_order: str,
    ) -> list[CandidateRecord]:
        reverse = sort_order == "desc"

        def sort_key(record: CandidateRecord):
            value = getattr(record, sort_by, None)
            if isinstance(value, datetime):
                return value
            if value is None:
                return ""
            return value

        return sorted(records, key=sort_key, reverse=reverse)
