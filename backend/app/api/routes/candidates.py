"""Candidate API routes."""

import logging
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from fastapi.responses import Response

from app.api.dependencies import get_candidate_service
from app.models.candidate_schemas import (
    CandidateDetailResponse,
    CandidateListResponse,
    CandidateQueryParams,
    CandidateUploadResponse,
    InterviewStatus,
    UpdateNotesRequest,
    UpdateStatusRequest,
)
from app.services.candidate_service import CandidateService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/candidates", tags=["candidates"])


@router.get("", response_model=CandidateListResponse)
async def list_candidates(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 10,
    search: str = "",
    status: InterviewStatus | None = None,
    role: str | None = None,
    sort_by: Literal[
        "full_name",
        "email",
        "position_applied",
        "total_experience_years",
        "interview_status",
        "recruiter_name",
        "resume_score",
        "upload_date",
    ] = "upload_date",
    sort_order: Literal["asc", "desc"] = "desc",
    service: CandidateService = Depends(get_candidate_service),
) -> CandidateListResponse:
    params = CandidateQueryParams(
        page=page,
        page_size=page_size,
        search=search,
        status=status,
        role=role,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return await service.list_candidates(params)


@router.get("/{candidate_id}", response_model=CandidateDetailResponse)
async def get_candidate(
    candidate_id: str,
    service: CandidateService = Depends(get_candidate_service),
) -> CandidateDetailResponse:
    return await service.get_candidate(candidate_id)


@router.post("/upload", response_model=CandidateUploadResponse)
async def upload_candidates(
    files: list[UploadFile] = File(...),
    position_applied: str | None = Form(default=None),
    recruiter_name: str | None = Form(default=None),
    service: CandidateService = Depends(get_candidate_service),
) -> CandidateUploadResponse:
    return await service.upload_resumes(
        files,
        position_applied=position_applied,
        recruiter_name=recruiter_name,
    )


@router.patch("/{candidate_id}/status", response_model=CandidateDetailResponse)
async def update_candidate_status(
    candidate_id: str,
    payload: UpdateStatusRequest,
    service: CandidateService = Depends(get_candidate_service),
) -> CandidateDetailResponse:
    return await service.update_status(candidate_id, payload)


@router.patch("/{candidate_id}/notes", response_model=CandidateDetailResponse)
async def update_candidate_notes(
    candidate_id: str,
    payload: UpdateNotesRequest,
    service: CandidateService = Depends(get_candidate_service),
) -> CandidateDetailResponse:
    return await service.update_notes(candidate_id, payload)


@router.get("/{candidate_id}/resume/download")
async def download_candidate_resume(
    candidate_id: str,
    service: CandidateService = Depends(get_candidate_service),
) -> Response:
    return await service.download_resume(candidate_id)
