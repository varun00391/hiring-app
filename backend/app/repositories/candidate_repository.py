"""Candidate persistence helpers."""

from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.models import ActivityLog, Candidate, CandidateStage, InterviewNote, Resume


async def list_candidates(
    session: AsyncSession,
    *,
    page: int,
    page_size: int,
    search: str | None,
    stage: CandidateStage | None,
    tag_member_id: UUID | None,
    assigned_only_tag: UUID | None,
) -> tuple[list[Candidate], int]:
    filters = [Candidate.deleted_at.is_(None)]
    if search:
        like = f"%{search}%"
        filters.append(
            or_(
                Candidate.full_name.ilike(like),
                Candidate.public_id.ilike(like),
                Candidate.email.ilike(like),
                Candidate.applied_role.ilike(like),
            )
        )
    if stage:
        filters.append(Candidate.current_stage == stage)
    if tag_member_id:
        filters.append(Candidate.assigned_tag_id == tag_member_id)
    if assigned_only_tag:
        filters.append(Candidate.assigned_tag_id == assigned_only_tag)

    count_stmt = select(func.count()).select_from(Candidate).where(*filters)
    total = await session.scalar(count_stmt)
    stmt = (
        select(Candidate)
        .where(*filters)
        .options(joinedload(Candidate.recruiter), joinedload(Candidate.tag_member))
        .order_by(Candidate.updated_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    result = await session.execute(stmt)
    rows = list(result.unique().scalars().all())
    return rows, int(total or 0)


async def get_candidate(session: AsyncSession, candidate_id: UUID) -> Candidate | None:
    stmt = (
        select(Candidate)
        .where(Candidate.id == candidate_id, Candidate.deleted_at.is_(None))
        .options(
            joinedload(Candidate.recruiter),
            joinedload(Candidate.tag_member),
            selectinload(Candidate.notes),
            selectinload(Candidate.activity_logs),
            selectinload(Candidate.resumes),
        )
    )
    result = await session.execute(stmt)
    return result.unique().scalar_one_or_none()


async def add_activity(
    session: AsyncSession,
    *,
    candidate_id: UUID,
    actor_id: UUID | None,
    action: str,
    entity_type: str = "candidate",
    details: dict | None = None,
) -> ActivityLog:
    log = ActivityLog(
        candidate_id=candidate_id,
        entity_type=entity_type,
        actor_id=actor_id,
        action=action,
        details=details or {},
    )
    session.add(log)
    await session.flush()
    return log


async def create_candidate(session: AsyncSession, candidate: Candidate) -> Candidate:
    session.add(candidate)
    await session.flush()
    await session.refresh(candidate)
    return candidate


async def update_candidate_fields(session: AsyncSession, candidate: Candidate, **fields: object) -> Candidate:
    for key, val in fields.items():
        if val is None:
            continue
        setattr(candidate, key, val)
    session.add(candidate)
    await session.flush()
    await session.refresh(candidate)
    return candidate


async def add_note(session: AsyncSession, note: InterviewNote) -> InterviewNote:
    session.add(note)
    await session.flush()
    await session.refresh(note)
    return note


async def get_resume(session: AsyncSession, resume_id: UUID) -> Resume | None:
    stmt = (
        select(Resume)
        .where(Resume.id == resume_id, Resume.deleted_at.is_(None))
        .options(joinedload(Resume.candidate))
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()
