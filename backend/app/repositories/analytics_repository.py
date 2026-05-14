"""Dashboard aggregation."""

from sqlalchemy import case, distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Candidate, CandidateStage, Role, RoleName, User


async def pipeline_stage_counts(session: AsyncSession) -> tuple[list[dict[str, int | str]], int]:
    """Counts of active candidates per pipeline stage (fixed stage order)."""
    stmt = (
        select(Candidate.current_stage, func.count(Candidate.id).label("n"))
        .where(Candidate.deleted_at.is_(None))
        .group_by(Candidate.current_stage)
    )
    rows = (await session.execute(stmt)).all()
    by_stage = {row.current_stage.value: int(row.n) for row in rows}
    ordered = [s.value for s in CandidateStage]
    stages = [{"stage": label, "count": by_stage.get(label, 0)} for label in ordered]
    total = sum(by_stage.values())
    return stages, total


async def count_distinct_open_roles(session: AsyncSession) -> int:
    stmt = select(func.count(distinct(Candidate.applied_role))).where(
        Candidate.deleted_at.is_(None),
        Candidate.applied_role.is_not(None),
        Candidate.current_stage.notin_([CandidateStage.hired, CandidateStage.rejected]),
    )
    result = await session.scalar(stmt)
    return int(result or 0)


async def recruiter_performance(session: AsyncSession, tag_member_id_limit=None) -> list[dict]:
    """Aggregate tag member stats."""
    tag_role = (
        await session.execute(select(Role.id).where(Role.name == RoleName.tag_member.value).limit(1))
    ).scalar_one()

    stmt = (
        select(
            User.id,
            User.full_name,
            User.specialization,
            func.count(Candidate.id).label("assigned"),
            func.sum(
                case(
                    (Candidate.current_stage == CandidateStage.hired, 1),
                    else_=0,
                )
            ).label("hired"),
            func.sum(
                case(
                    (
                        Candidate.current_stage.in_(
                            [
                                CandidateStage.interview_scheduled,
                                CandidateStage.interview_completed,
                                CandidateStage.technical_round,
                                CandidateStage.hr_round,
                                CandidateStage.offer_sent,
                            ]
                        ),
                        1,
                    ),
                    else_=0,
                )
            ).label("active_positions"),
        )
        .join(Candidate, (Candidate.assigned_tag_id == User.id) & (Candidate.deleted_at.is_(None)), isouter=True)
        .where(User.role_id == tag_role, User.deleted_at.is_(None))
    )
    if tag_member_id_limit is not None:
        stmt = stmt.where(User.id == tag_member_id_limit)
    stmt = stmt.group_by(User.id, User.full_name, User.specialization)
    rows = (await session.execute(stmt)).all()
    out: list[dict] = []
    for row in rows:
        assigned = int(row.assigned or 0)
        hired = int(row.hired or 0)
        ratio = (hired / assigned) if assigned else 0.0
        out.append(
            {
                "member_id": row.id,
                "member_name": row.full_name,
                "specialization": row.specialization,
                "assigned_candidates": assigned,
                "hired_candidates": hired,
                "success_ratio": round(ratio, 3),
                "active_positions": int(row.active_positions or 0),
            }
        )
    return out
