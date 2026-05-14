from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.schemas.common import DashboardMetricCard, DashboardResponse
from app.services.hirebot import dashboard_metrics

router = APIRouter()


@router.get("/dashboard/metrics", response_model=DashboardResponse)
async def dashboard_metrics_route(session: Annotated[AsyncSession, Depends(get_db)]):
    raw = await dashboard_metrics(session)
    return DashboardResponse(metrics=[DashboardMetricCard(**m) for m in raw])
