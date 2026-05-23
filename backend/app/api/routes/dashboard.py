"""Dashboard API routes."""

from fastapi import APIRouter, Depends

from app.api.dependencies import get_dashboard_service
from app.models.candidate_schemas import DashboardResponse
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/metrics", response_model=DashboardResponse)
async def get_dashboard_metrics(
    service: DashboardService = Depends(get_dashboard_service),
) -> DashboardResponse:
    return await service.get_metrics()
