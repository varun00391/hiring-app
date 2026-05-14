import csv
import secrets
from io import StringIO
from pathlib import Path
from uuid import UUID

import aiofiles
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_optional, require_admin
from app.core.config import get_settings
from app.database.session import get_db
from app.models import Candidate, CandidateStage, ExtractionStatus, InterviewNote, Resume, RoleName
from app.repositories import candidate_repository
from app.schemas.common import (
    ActivityLogOut,
    CandidateAssignRequest,
    CandidateCreate,
    CandidateDetail,
    CandidateOut,
    CandidateStageUpdate,
    CandidateUpdate,
    InterviewNoteCreate,
    InterviewNoteOut,
    PaginatedCandidates,
    ResumeOut,
    UploadResultItem,
)
from app.services.hirebot import assign_candidate_staff, assert_candidate_visibility, candidate_entity_to_dict
from app.workers.extraction import run_resume_extraction

router = APIRouter()
settings = get_settings()

ALLOWED_MIME = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


def _public_id() -> str:
    return f"HB-{secrets.token_hex(4).upper()}"


def _scoped_tag_filters(
    role_name: str, user_id: UUID, requested_tag_member_id: UUID | None
) -> tuple[UUID | None, UUID | None]:
    """Returns (assigned_only_tag_for_user, admin_tag_dropdown_filter)."""
    if role_name == RoleName.tag_member.value:
        return user_id, None
    if role_name == RoleName.admin.value:
        return None, requested_tag_member_id
    raise HTTPException(status.HTTP_403_FORBIDDEN, "Unsupported role")


@router.get("/candidates", response_model=PaginatedCandidates)
async def list_candidates_route(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user=Depends(get_current_user_optional),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    stage: CandidateStage | None = None,
    tag_member_id: UUID | None = None,
):
    assigned_only, tag_filter = _scoped_tag_filters(
        current_user.role.name, current_user.id, tag_member_id
    )
    rows, total = await candidate_repository.list_candidates(
        session,
        page=page,
        page_size=page_size,
        search=search,
        stage=stage,
        tag_member_id=tag_filter,
        assigned_only_tag=assigned_only,
    )
    items = [CandidateOut(**candidate_entity_to_dict(candidate)) for candidate in rows]
    return PaginatedCandidates(items=items, total=total, page=page, page_size=page_size)


@router.post("/candidates", response_model=CandidateOut, status_code=status.HTTP_201_CREATED)
async def create_candidate_route(
    payload: CandidateCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user=Depends(get_current_user_optional),
):
    candidate = Candidate(
        public_id=_public_id(),
        full_name=payload.full_name,
        email=str(payload.email) if payload.email else None,
        phone=payload.phone,
        applied_role=payload.applied_role,
        experience_years=payload.experience_years,
        current_stage=CandidateStage.applied,
        parsed_metadata={"pipeline": "manual"},
        status="Active",
    )
    if current_user.role.name == RoleName.tag_member.value:
        candidate.assigned_tag_id = current_user.id

    await candidate_repository.create_candidate(session, candidate)
    await candidate_repository.add_activity(
        session,
        candidate_id=candidate.id,
        actor_id=current_user.id,
        action="candidate_created",
        details={"source": "manual_form"},
    )
    await session.commit()

    hydrated = await candidate_repository.get_candidate(session, candidate.id)
    return CandidateOut(**candidate_entity_to_dict(hydrated))


@router.get("/candidates/export")
async def export_candidates_csv(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user=Depends(get_current_user_optional),
    search: str | None = None,
    stage: CandidateStage | None = None,
    tag_member_id: UUID | None = None,
):
    assigned_only, tag_filter = _scoped_tag_filters(
        current_user.role.name, current_user.id, tag_member_id
    )

    rows, _ = await candidate_repository.list_candidates(
        session,
        page=1,
        page_size=5000,
        search=search,
        stage=stage,
        tag_member_id=tag_filter,
        assigned_only_tag=assigned_only,
    )

    buffer = StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "public_id",
            "full_name",
            "email",
            "applied_role",
            "experience",
            "stage",
            "match_score",
            "recruiter",
            "tag_member",
            "status",
            "updated_at",
        ]
    )
    for cand in rows:
        data = candidate_entity_to_dict(cand)
        writer.writerow(
            [
                data["public_id"],
                data["full_name"],
                data["email"],
                data["applied_role"],
                data["experience_years"],
                data["current_stage"].value,
                data["ai_match_score"],
                data["recruiter_name"],
                data["tag_member_name"],
                data["status"],
                data["updated_at"].isoformat(),
            ]
        )

    headers = {"Content-Disposition": "attachment; filename=candidates.csv"}

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers=headers,
    )


@router.get("/candidates/{candidate_id}", response_model=CandidateDetail)
async def candidate_detail_route(
    candidate_id: UUID,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user=Depends(get_current_user_optional),
):
    candidate = await assert_candidate_visibility(session, candidate_id, current_user)
    base = candidate_entity_to_dict(candidate)

    notes = [n for n in candidate.notes if n.deleted_at is None]
    notes.sort(key=lambda x: x.created_at, reverse=True)

    logs = [a for a in candidate.activity_logs if a.deleted_at is None]
    logs.sort(key=lambda x: x.created_at, reverse=True)

    resumes = [r for r in candidate.resumes if r.deleted_at is None]
    resumes.sort(key=lambda x: x.created_at, reverse=True)

    return CandidateDetail(
        **base,
        notes=[InterviewNoteOut.model_validate(n) for n in notes],
        activity=[ActivityLogOut.model_validate(a) for a in logs],
        resumes=[ResumeOut.model_validate(r) for r in resumes],
    )


@router.patch("/candidates/{candidate_id}", response_model=CandidateOut)
async def patch_candidate_route(
    candidate_id: UUID,
    payload: CandidateUpdate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user=Depends(get_current_user_optional),
):
    candidate = await assert_candidate_visibility(session, candidate_id, current_user)
    patch = payload.model_dump(exclude_unset=True)
    if "email" in patch and patch["email"] is not None:
        patch["email"] = str(patch["email"])

    await candidate_repository.update_candidate_fields(session, candidate, **patch)
    await candidate_repository.add_activity(
        session,
        candidate_id=candidate.id,
        actor_id=current_user.id,
        action="candidate_updated",
        details=patch,
    )
    await session.commit()

    refreshed = await candidate_repository.get_candidate(session, candidate_id)
    return CandidateOut(**candidate_entity_to_dict(refreshed))


@router.post("/candidates/{candidate_id}/assign", response_model=CandidateOut)
async def assign_candidate_route(
    candidate_id: UUID,
    payload: CandidateAssignRequest,
    session: Annotated[AsyncSession, Depends(get_db)],
    admin=Depends(require_admin),
):
    if payload.recruiter_id is None and payload.tag_member_id is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Provide recruiter_id and/or tag_member_id")

    await assign_candidate_staff(
        session,
        candidate_id,
        payload.recruiter_id,
        payload.tag_member_id,
        admin.id,
    )
    refreshed = await candidate_repository.get_candidate(session, candidate_id)
    return CandidateOut(**candidate_entity_to_dict(refreshed))


@router.patch("/candidates/{candidate_id}/stage", response_model=CandidateOut)
async def update_candidate_stage_route(
    candidate_id: UUID,
    payload: CandidateStageUpdate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user=Depends(get_current_user_optional),
):
    candidate = await assert_candidate_visibility(session, candidate_id, current_user)
    previous = candidate.current_stage
    candidate.current_stage = payload.stage
    session.add(candidate)

    await candidate_repository.add_activity(
        session,
        candidate_id=candidate.id,
        actor_id=current_user.id,
        action="stage_changed",
        details={"from": previous.value, "to": payload.stage.value},
    )

    if payload.note:
        session.add(
            InterviewNote(candidate_id=candidate.id, author_id=current_user.id, body=payload.note)
        )

    await session.commit()

    hydrated = await candidate_repository.get_candidate(session, candidate_id)
    return CandidateOut(**candidate_entity_to_dict(hydrated))


@router.post("/candidates/{candidate_id}/notes", response_model=InterviewNoteOut, status_code=status.HTTP_201_CREATED)
async def create_note_route(
    candidate_id: UUID,
    payload: InterviewNoteCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user=Depends(get_current_user_optional),
):
    candidate = await assert_candidate_visibility(session, candidate_id, current_user)
    note = InterviewNote(candidate_id=candidate.id, author_id=current_user.id, body=payload.body)
    await candidate_repository.add_note(session, note)
    await candidate_repository.add_activity(
        session,
        candidate_id=candidate.id,
        actor_id=current_user.id,
        action="note_added",
        details={"note_id": str(note.id)},
    )
    await session.commit()
    return InterviewNoteOut.model_validate(note)


@router.post("/resumes/upload", response_model=list[UploadResultItem])
async def upload_resumes_route(
    background_tasks: BackgroundTasks,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user=Depends(get_current_user_optional),
    files: list[UploadFile] = File(...),
):
    if len(files) > settings.max_files_per_request:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Too many files in one upload")

    upload_root = Path(settings.upload_dir)
    upload_root.mkdir(parents=True, exist_ok=True)
    outputs: list[UploadResultItem] = []

    for upload in files:
        if not upload.filename:
            outputs.append(
                UploadResultItem(filename="unknown", status="failed", error="Missing filename")
            )
            continue

        blob = await upload.read()
        if len(blob) > settings.max_upload_mb * 1024 * 1024:
            outputs.append(
                UploadResultItem(filename=upload.filename, status="failed", error="File exceeds 10MB cap")
            )
            continue

        ctype = upload.content_type or ""
        if ctype not in ALLOWED_MIME:
            outputs.append(
                UploadResultItem(
                    filename=upload.filename,
                    status="failed",
                    error="Only PDF or DOCX uploads are allowed",
                )
            )
            continue

        slug = Path(upload.filename).stem.replace("_", " ")[:240] or "New Candidate"
        candidate = Candidate(
            public_id=_public_id(),
            full_name=slug,
            current_stage=CandidateStage.applied,
            parsed_metadata={"pipeline": "hirebot"},
            applied_role="General Application",
            status="Parsing",
        )
        if current_user.role.name == RoleName.tag_member.value:
            candidate.assigned_tag_id = current_user.id

        await candidate_repository.create_candidate(session, candidate)

        target_dir = upload_root / str(candidate.id)
        target_dir.mkdir(parents=True, exist_ok=True)
        stored_name = f"{secrets.token_hex(8)}_{upload.filename}"
        disk_path = target_dir / stored_name

        async with aiofiles.open(disk_path, "wb") as out_file:
            await out_file.write(blob)

        resume = Resume(
            candidate_id=candidate.id,
            file_path=str(disk_path.resolve()),
            original_filename=upload.filename,
            mime_type=ctype,
            extraction_status=ExtractionStatus.pending,
        )
        session.add(resume)
        await session.flush()

        await candidate_repository.add_activity(
            session,
            candidate_id=candidate.id,
            actor_id=current_user.id,
            action="resume_uploaded",
            details={"resume_id": str(resume.id)},
        )

        outputs.append(
            UploadResultItem(filename=upload.filename, status="queued", candidate_id=candidate.id)
        )

        background_tasks.add_task(run_resume_extraction, resume.id)

    await session.commit()
    return outputs


@router.get("/resumes/{resume_id}/file")
async def download_resume_file(
    resume_id: UUID,
    session: Annotated[AsyncSession, Depends(get_db)],
    user=Depends(get_current_user_optional),
):
    resume = await candidate_repository.get_resume(session, resume_id)
    if not resume:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Resume not found")

    await assert_candidate_visibility(session, resume.candidate_id, user)

    path = Path(resume.file_path)
    if not path.exists():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Underlying file missing on disk")

    return FileResponse(
        path=str(path.resolve()),
        filename=resume.original_filename,
        media_type=resume.mime_type or "application/octet-stream",
    )
