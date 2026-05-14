from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_optional, require_admin
from app.database.session import get_db
from app.models import CandidateStage, RoleName
from app.repositories import user_repository
from app.repositories.analytics_repository import recruiter_performance as recruiter_performance_query
from app.schemas.common import TagPerformanceRow, UserOut

router = APIRouter()


@router.get("/recruiters/performance", response_model=list[TagPerformanceRow])
async def recruiter_performance_route(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user=Depends(get_current_user_optional),
):
    limit_id = current_user.id if current_user.role.name == RoleName.tag_member.value else None
    rows = await recruiter_performance_query(session, tag_member_id_limit=limit_id)
    return [TagPerformanceRow(**row) for row in rows]


@router.get("/reference/tag-members", response_model=list[UserOut])
async def tag_members_for_assignment(
    session: Annotated[AsyncSession, Depends(get_db)],
    _admin=Depends(require_admin),
):
    members = await user_repository.list_tag_members(session)
    return [UserOut.model_validate(m) for m in members]


@router.get("/reference/recruiters", response_model=list[UserOut])
async def recruiters_for_assignment(
    session: Annotated[AsyncSession, Depends(get_db)],
    _admin=Depends(require_admin),
):
    recruiters = await user_repository.list_admins(session)
    return [UserOut.model_validate(m) for m in recruiters]


@router.get("/reference/stages", response_model=list[str])
async def hiring_stages(_user=Depends(get_current_user_optional)):
    return [s.value for s in CandidateStage]
