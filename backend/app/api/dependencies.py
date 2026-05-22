"""FastAPI route dependencies."""

from functools import lru_cache

from app.config import Settings, get_settings
from app.services.resume_pipeline import ResumePipelineService


@lru_cache
def get_pipeline_service() -> ResumePipelineService:
    settings = get_settings()
    return ResumePipelineService(settings)


def get_app_settings() -> Settings:
    return get_settings()
