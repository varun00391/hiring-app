"""Admin user provisioning endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.database.session import get_db
from app.schemas.common import TagMemberCreate, UserOut
from app.services import hirebot

router = APIRouter(tags=["users"])


@router.post("/users/tag-members", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_tag_member_account(
    payload: TagMemberCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
    _admin=Depends(require_admin),
):
    user = await hirebot.create_tag_member_user(
        session,
        email=str(payload.email),
        password=payload.password,
        full_name=payload.full_name,
        specialization=payload.specialization,
    )
    await session.commit()
    return UserOut.model_validate(user)
