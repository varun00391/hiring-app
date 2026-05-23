"""Calendar event generation — extensible for Google/Outlook APIs."""

import logging
from datetime import datetime

from app.config import Settings
from app.models.communication_schemas import InterviewRecord, MeetingMode

logger = logging.getLogger(__name__)


class CalendarService:
    """MVP calendar service that generates internal events and placeholder meeting links."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def generate_meeting_link(self, interview_id: str, mode: MeetingMode) -> str | None:
        if mode == MeetingMode.OFFLINE:
            return None

        base_links = {
            MeetingMode.GOOGLE_MEET: "https://meet.google.com/lookup",
            MeetingMode.ZOOM: "https://zoom.us/j",
            MeetingMode.MICROSOFT_TEAMS: "https://teams.microsoft.com/l/meetup-join",
        }
        prefix = base_links.get(mode, "https://meet.example.com")
        return f"{prefix}/{interview_id[:8]}"

    def build_interview_invite_body(
        self,
        *,
        candidate_name: str,
        role: str,
        interview: InterviewRecord,
    ) -> str:
        when = interview.scheduled_at.strftime("%A, %B %d, %Y at %I:%M %p UTC")
        lines = [
            f"Hi {candidate_name},",
            "",
            f"You are invited to an interview for the {role} position.",
            "",
            f"Type: {interview.interview_type}",
            f"Date & Time: {when}",
            f"Duration: {interview.duration_minutes} minutes",
            f"Interviewer: {interview.interviewer_name}",
            f"Mode: {interview.meeting_mode.value.replace('_', ' ').title()}",
        ]
        if interview.meeting_link:
            lines.extend(["", f"Meeting Link: {interview.meeting_link}"])
        if interview.location:
            lines.extend(["", f"Location: {interview.location}"])
        if interview.notes:
            lines.extend(["", f"Notes: {interview.notes}"])
        lines.extend(["", "Please reply to confirm your availability.", "", "Best regards,"])
        return "\n".join(lines)

    def create_internal_event(self, interview: InterviewRecord) -> dict:
        """Return internal calendar event payload (future: push to Google/Outlook)."""
        return {
            "provider": "internal",
            "event_id": interview.id,
            "title": f"Interview — {interview.interview_type}",
            "start": interview.scheduled_at.isoformat(),
            "duration_minutes": interview.duration_minutes,
            "meeting_link": interview.meeting_link,
            "status": "confirmed" if interview.confirmed else "scheduled",
        }
