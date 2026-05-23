"""Interview scheduling API routes."""

from fastapi import APIRouter, Depends

from app.api.dependencies import get_interview_service, get_timeline_service
from app.models.communication_schemas import (
    ActivityTimelineResponse,
    InterviewListResponse,
    ScheduleInterviewRequest,
    ScheduleInterviewResponse,
)
from app.services.interview_service import InterviewService
from app.services.timeline_service import TimelineService

router = APIRouter(tags=["interviews"])


@router.post("/interviews/schedule", response_model=ScheduleInterviewResponse)
async def schedule_interview(
    payload: ScheduleInterviewRequest,
    service: InterviewService = Depends(get_interview_service),
) -> ScheduleInterviewResponse:
    return await service.schedule_interview(payload)


@router.get("/interviews/candidate/{candidate_id}", response_model=InterviewListResponse)
async def list_candidate_interviews(
    candidate_id: str,
    service: InterviewService = Depends(get_interview_service),
) -> InterviewListResponse:
    return await service.list_candidate_interviews(candidate_id)


@router.get("/timeline/candidate/{candidate_id}", response_model=ActivityTimelineResponse)
async def get_candidate_timeline(
    candidate_id: str,
    service: TimelineService = Depends(get_timeline_service),
) -> ActivityTimelineResponse:
    events = await service.get_candidate_timeline(candidate_id)
    return ActivityTimelineResponse(events=events)
