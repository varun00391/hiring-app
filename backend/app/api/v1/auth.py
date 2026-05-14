"""JSON login endpoint issuing JWT bearer tokens."""

from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_optional
from app.database.session import get_db
from app.schemas.common import LoginRequest, Token, UserOut
from app.services import hirebot

router = APIRouter(tags=["authentication"])


@router.post("/auth/login", response_model=Token, status_code=status.HTTP_200_OK)
async def login(payload: LoginRequest, session: Annotated[AsyncSession, Depends(get_db)]):
    token, _user = await hirebot.authenticate_user(session, str(payload.email).lower(), payload.password)
    await session.commit()
    return Token(access_token=token)


@router.post("/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout():
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/auth/me", response_model=UserOut)
async def read_me(user=Depends(get_current_user_optional)):
    return UserOut.model_validate(user)
