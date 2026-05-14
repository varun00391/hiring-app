"""Fetch user records."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models import Role, RoleName, User


async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    stmt = (
        select(User)
        .options(joinedload(User.role))
        .where(User.email == email.lower(), User.deleted_at.is_(None))
        .limit(1)
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def get_user_by_id(session: AsyncSession, user_id: UUID) -> User | None:
    stmt = (
        select(User).options(joinedload(User.role)).where(User.id == user_id, User.deleted_at.is_(None)).limit(1)
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def list_tag_members(session: AsyncSession) -> list[User]:
    stmt = (
        select(User)
        .join(Role)
        .where(Role.name == RoleName.tag_member.value, User.deleted_at.is_(None))
        .options(joinedload(User.role))
    )
    result = await session.execute(stmt)
    return list(result.unique().scalars().all())


async def list_admins(session: AsyncSession) -> list[User]:
    stmt = (
        select(User)
        .join(Role)
        .where(Role.name == RoleName.admin.value, User.deleted_at.is_(None))
        .options(joinedload(User.role))
    )
    result = await session.execute(stmt)
    return list(result.unique().scalars().all())
