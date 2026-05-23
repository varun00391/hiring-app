"""FastAPI application entrypoint."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.dependencies import get_inbox_poller_service
from app.api.routes import candidates, dashboard, email_routes, health, interview_routes, resume
from app.config import get_settings
from app.exceptions.handlers import register_exception_handlers
from app.utils.logging import setup_logging


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = get_settings()
    setup_logging(settings)
    poller = get_inbox_poller_service()
    await poller.start()
    yield
    await poller.stop()


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        lifespan=lifespan,
        docs_url=f"{settings.api_prefix}/docs",
        redoc_url=f"{settings.api_prefix}/redoc",
        openapi_url=f"{settings.api_prefix}/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)

    app.include_router(health.router, prefix=settings.api_prefix)
    app.include_router(resume.router, prefix=settings.api_prefix)
    app.include_router(candidates.router, prefix=settings.api_prefix)
    app.include_router(dashboard.router, prefix=settings.api_prefix)
    app.include_router(email_routes.router, prefix=settings.api_prefix)
    app.include_router(interview_routes.router, prefix=settings.api_prefix)

    return app


app = create_app()
