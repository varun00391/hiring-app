"""Version-1 aggregated API routers."""

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user_optional
from app.api.v1 import analytics, auth, candidates, dashboard, recruiters, users

secured = APIRouter(dependencies=[Depends(get_current_user_optional)])

secured.include_router(dashboard.router, prefix="", tags=["dashboard"])
secured.include_router(analytics.router, prefix="", tags=["analytics"])
secured.include_router(candidates.router, prefix="", tags=["candidates"])
secured.include_router(recruiters.router, prefix="", tags=["recruiters"])
secured.include_router(users.router, prefix="", tags=["users"])

api_router = APIRouter()
api_router.include_router(auth.router, prefix="", tags=["authentication"])
api_router.include_router(secured)
