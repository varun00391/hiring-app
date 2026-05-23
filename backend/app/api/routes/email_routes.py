"""Email API routes."""

from fastapi import APIRouter, Depends

from app.api.dependencies import get_communication_service
from app.models.communication_schemas import (
    EmailListResponse,
    SendEmailRequest,
    SendEmailResponse,
    UpdateCommunicationStatusRequest,
)
from app.services.communication_service import CommunicationService

router = APIRouter(prefix="/emails", tags=["emails"])


@router.post("/send", response_model=SendEmailResponse)
async def send_email(
    payload: SendEmailRequest,
    service: CommunicationService = Depends(get_communication_service),
) -> SendEmailResponse:
    return await service.send_email(payload)


@router.get("/candidate/{candidate_id}", response_model=EmailListResponse)
async def list_candidate_emails(
    candidate_id: str,
    service: CommunicationService = Depends(get_communication_service),
) -> EmailListResponse:
    return await service.list_candidate_emails(candidate_id)


@router.patch("/candidate/{candidate_id}/communication-status")
async def update_communication_status(
    candidate_id: str,
    payload: UpdateCommunicationStatusRequest,
    service: CommunicationService = Depends(get_communication_service),
):
    status = await service.update_communication_status(candidate_id, payload)
    return {"success": True, "communication_status": status}
