"""Resume parsing API routes."""

import logging

from fastapi import APIRouter, Depends, File, UploadFile

from app.api.dependencies import get_pipeline_service
from app.models.schemas import ResumeParseResponse
from app.services.resume_pipeline import ResumePipelineService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/resumes", tags=["resumes"])


@router.post("/parse", response_model=ResumeParseResponse)
async def parse_resume(
    file: UploadFile = File(..., description="Resume file (PDF, DOC, or DOCX)"),
    pipeline: ResumePipelineService = Depends(get_pipeline_service),
) -> ResumeParseResponse:
    """Upload a resume and receive structured parsed output."""
    return await pipeline.process_upload(file)
