from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.repositories import analytics_repository
from app.schemas.common import PipelineResponse, PipelineStageRow

router = APIRouter()


@router.get("/analytics/pipeline", response_model=PipelineResponse)
async def pipeline_distribution_route(session: Annotated[AsyncSession, Depends(get_db)]):
    stages, total = await analytics_repository.pipeline_stage_counts(session)
    return PipelineResponse(stages=[PipelineStageRow(**s) for s in stages], total=total)
