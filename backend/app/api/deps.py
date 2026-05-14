"""Shared route dependencies."""

from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.database.session import get_db
from app.models import RoleName
from app.repositories import user_repository

auth_scheme = HTTPBearer(auto_error=False)


async def get_current_user_optional(
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(auth_scheme)],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    if not creds:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    try:
        payload = decode_token(creds.credentials)
    except ValueError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token") from None
    user_id = payload.get("sub")
    user = await user_repository.get_user_by_id(session, UUID(user_id))
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Unknown user")
    return user


async def require_admin(current_user=Depends(get_current_user_optional)):
    if current_user.role.name != RoleName.admin.value:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin only")
    return current_user
