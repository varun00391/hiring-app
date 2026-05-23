"""FastAPI route dependencies."""

from functools import lru_cache
from pathlib import Path

from app.config import Settings, get_settings
from app.repositories.activity_repository import ActivityRepository
from app.repositories.candidate_repository import CandidateRepository
from app.repositories.communication_repository import CommunicationRepository
from app.repositories.interview_repository import InterviewRepository
from app.services.calendar_service import CalendarService
from app.services.candidate_service import CandidateService
from app.services.communication_service import CommunicationService
from app.services.dashboard_service import DashboardService
from app.services.email_service import EmailService
from app.services.file_storage import FileStorageService
from app.services.inbox_poller_service import InboxPollerService
from app.services.interview_service import InterviewService
from app.services.resume_pipeline import ResumePipelineService
from app.services.resume_scorer import ResumeScorer
from app.services.timeline_service import TimelineService


def _data_path(filename: str) -> Path:
    settings = get_settings()
    return Path(settings.data_dir) / filename


@lru_cache
def get_candidate_repository() -> CandidateRepository:
    legacy = Path(get_settings().upload_temp_dir).parent / "candidates.json"
    data_file = legacy if legacy.exists() else _data_path("candidates.json")
    return CandidateRepository(data_file=str(data_file))


@lru_cache
def get_communication_repository() -> CommunicationRepository:
    return CommunicationRepository(_data_path("communications.json"))


@lru_cache
def get_interview_repository() -> InterviewRepository:
    return InterviewRepository(_data_path("interviews.json"))


@lru_cache
def get_activity_repository() -> ActivityRepository:
    return ActivityRepository(_data_path("activity_timeline.json"))


@lru_cache
def get_file_storage_service() -> FileStorageService:
    return FileStorageService(get_settings())


@lru_cache
def get_resume_scorer() -> ResumeScorer:
    return ResumeScorer()


@lru_cache
def get_pipeline_service() -> ResumePipelineService:
    return ResumePipelineService(get_settings())


@lru_cache
def get_email_service() -> EmailService:
    return EmailService(get_settings())


@lru_cache
def get_calendar_service() -> CalendarService:
    return CalendarService(get_settings())


@lru_cache
def get_timeline_service() -> TimelineService:
    return TimelineService(get_activity_repository())


@lru_cache
def get_communication_service() -> CommunicationService:
    return CommunicationService(
        settings=get_settings(),
        candidate_repo=get_candidate_repository(),
        communication_repo=get_communication_repository(),
        email_service=get_email_service(),
        timeline_service=get_timeline_service(),
    )


@lru_cache
def get_interview_service() -> InterviewService:
    return InterviewService(
        settings=get_settings(),
        candidate_repo=get_candidate_repository(),
        interview_repo=get_interview_repository(),
        calendar_service=get_calendar_service(),
        communication_service=get_communication_service(),
        timeline_service=get_timeline_service(),
    )


@lru_cache
def get_inbox_poller_service() -> InboxPollerService:
    return InboxPollerService(
        settings=get_settings(),
        candidate_repo=get_candidate_repository(),
        communication_service=get_communication_service(),
    )


@lru_cache
def get_candidate_service() -> CandidateService:
    settings = get_settings()
    return CandidateService(
        settings=settings,
        repository=get_candidate_repository(),
        pipeline=get_pipeline_service(),
        storage=get_file_storage_service(),
        scorer=get_resume_scorer(),
        timeline_service=get_timeline_service(),
    )


@lru_cache
def get_dashboard_service() -> DashboardService:
    return DashboardService(get_candidate_repository())


def get_app_settings() -> Settings:
    return get_settings()
