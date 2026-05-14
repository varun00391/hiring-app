"""Domain services for HireBot."""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password, verify_password
from app.models import CandidateStage, RecruiterAssignment, Role, RoleName, User
from app.repositories import analytics_repository
from app.repositories import candidate_repository, user_repository


async def authenticate_user(session: AsyncSession, email: str, password: str):
    user = await user_repository.get_user_by_email(session, email.lower())
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if user.role.name not in {RoleName.admin.value, RoleName.tag_member.value}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    token = create_access_token(
        subject=str(user.id),
        extra_claims={"role": user.role.name, "email": user.email},
    )
    return token, user


async def create_tag_member_user(
    session: AsyncSession,
    *,
    email: str,
    password: str,
    full_name: str,
    specialization: str | None,
) -> User:
    normalized_email = email.strip().lower()
    if await user_repository.get_user_by_email(session, normalized_email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    role_id = await session.scalar(select(Role.id).where(Role.name == RoleName.tag_member.value).limit(1))
    if role_id is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="TAG member role is not configured",
        )

    spec = specialization.strip() if specialization else None
    if spec == "":
        spec = None

    user = User(
        email=normalized_email,
        full_name=full_name.strip(),
        hashed_password=hash_password(password),
        role_id=role_id,
        specialization=spec,
    )
    session.add(user)
    await session.flush()
    created = await user_repository.get_user_by_id(session, user.id)
    if created is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user",
        )
    return created


def candidate_entity_to_dict(candidate):
    recruiter_name = candidate.recruiter.full_name if candidate.recruiter else None
    tag_member_name = candidate.tag_member.full_name if candidate.tag_member else None
    return {
        "id": candidate.id,
        "public_id": candidate.public_id,
        "full_name": candidate.full_name,
        "email": candidate.email,
        "phone": candidate.phone,
        "applied_role": candidate.applied_role,
        "experience_years": candidate.experience_years,
        "current_stage": candidate.current_stage,
        "ai_match_score": candidate.ai_match_score,
        "recruiter_id": candidate.recruiter_id,
        "assigned_tag_id": candidate.assigned_tag_id,
        "recruiter_name": recruiter_name,
        "tag_member_name": tag_member_name,
        "interview_date": candidate.interview_date,
        "status": candidate.status,
        "linkedin_url": candidate.linkedin_url,
        "github_url": candidate.github_url,
        "skills": candidate.skills,
        "certifications": candidate.certifications,
        "education": candidate.education,
        "work_experience": candidate.work_experience,
        "projects": candidate.projects,
        "parsed_metadata": candidate.parsed_metadata,
        "created_at": candidate.created_at,
        "updated_at": candidate.updated_at,
    }


async def assert_candidate_visibility(session: AsyncSession, candidate_id: UUID, current_user):
    cand = await candidate_repository.get_candidate(session, candidate_id)
    if not cand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")
    if current_user.role.name == RoleName.admin.value:
        return cand
    if current_user.role.name == RoleName.tag_member.value and cand.assigned_tag_id == current_user.id:
        return cand
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")


async def assign_candidate_staff(
    session: AsyncSession, candidate_id: UUID, recruiter_id: UUID | None, tag_member_id: UUID | None, actor_id
):
    candidate = await candidate_repository.get_candidate(session, candidate_id)
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    prev = {"recruiter_id": str(candidate.recruiter_id), "tag_member_id": str(candidate.assigned_tag_id)}
    updated = False
    if recruiter_id is not None:
        candidate.recruiter_id = recruiter_id
        updated = True
    if tag_member_id is not None:
        candidate.assigned_tag_id = tag_member_id
        updated = True
    session.add(candidate)
    if updated:
        session.add(
            RecruiterAssignment(
                candidate_id=candidate.id,
                recruiter_id=candidate.recruiter_id,
                tag_member_id=candidate.assigned_tag_id,
            )
        )

    await candidate_repository.add_activity(
        session,
        candidate_id=candidate.id,
        actor_id=actor_id,
        action="assignment_updated",
        details={
            "previous": prev,
            "current": {"recruiter_id": str(candidate.recruiter_id), "tag": str(candidate.assigned_tag_id)},
        },
    )
    await session.commit()
    await session.refresh(candidate)
    return candidate


async def dashboard_metrics(session: AsyncSession):
    from sqlalchemy import func, select

    from app.models import Candidate

    async def _scalar(stmt):
        return int((await session.scalar(stmt)) or 0)

    base = Candidate.deleted_at.is_(None)
    total = await _scalar(select(func.count()).select_from(Candidate).where(base))

    stmt_offer = select(func.count()).select_from(Candidate).where(base, Candidate.current_stage == CandidateStage.offer_sent)
    in_offer = await _scalar(stmt_offer)

    stmt_hired = select(func.count()).select_from(Candidate).where(base, Candidate.current_stage == CandidateStage.hired)
    hired = await _scalar(stmt_hired)

    stmt_rejected = select(func.count()).select_from(Candidate).where(base, Candidate.current_stage == CandidateStage.rejected)
    rejected_count = await _scalar(stmt_rejected)

    stmt_pending = select(func.count()).select_from(Candidate).where(
        base,
        Candidate.current_stage.in_([CandidateStage.applied, CandidateStage.screening]),
    )
    pending = await _scalar(stmt_pending)

    stmt_interviews = select(func.count()).select_from(Candidate).where(
        base, Candidate.current_stage == CandidateStage.interview_scheduled
    )
    interviews = await _scalar(stmt_interviews)

    stmt_bot = select(func.count()).select_from(Candidate).where(
        base,
        Candidate.parsed_metadata.is_not(None),
        Candidate.parsed_metadata.contains({"pipeline": "hirebot"}),
    )
    hirebot = await _scalar(stmt_bot)

    open_roles = await analytics_repository.count_distinct_open_roles(session)

    metrics = [
        {"key": "total", "title": "Total Candidates", "value": total},
        {"key": "open_roles", "title": "Open Roles", "value": open_roles},
        {"key": "in_offer", "title": "In Offer", "value": in_offer},
        {"key": "hired", "title": "Hired", "value": hired},
        {"key": "pending", "title": "Pending", "value": pending},
        {"key": "hirebot", "title": "HireBot", "value": hirebot},
        {"key": "rejected", "title": "Rejected", "value": rejected_count},
        {"key": "interviews", "title": "Interviews Scheduled", "value": interviews},
    ]
    return metrics
