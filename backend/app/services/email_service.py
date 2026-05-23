"""SMTP email delivery service — modular for future Gmail/Outlook API adapters."""

import asyncio
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import Settings
from app.exceptions import EmailSendError

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def _append_signature(self, body: str) -> str:
        signature = self._settings.recruiter_signature.strip()
        if not signature:
            return body
        return f"{body.rstrip()}\n\n{signature}"

    async def send_email(
        self,
        *,
        to_email: str,
        subject: str,
        body: str,
        include_signature: bool = True,
    ) -> dict:
        final_body = self._append_signature(body) if include_signature else body
        from_email = self._settings.smtp_from_email or self._settings.smtp_username

        if not self._settings.smtp_enabled:
            logger.info(
                "SMTP disabled — email stored only (dev mode)",
                extra={"extra_fields": {"to": to_email, "subject": subject}},
            )
            return {
                "sent": False,
                "simulated": True,
                "from": from_email,
                "to": to_email,
                "subject": subject,
                "body": final_body,
            }

        if not from_email or not self._settings.smtp_password:
            raise EmailSendError(
                "SMTP is not configured. Set SMTP_USERNAME, SMTP_PASSWORD, and SMTP_FROM_EMAIL.",
            )

        try:
            await asyncio.to_thread(
                self._send_smtp,
                from_email,
                to_email,
                subject,
                final_body,
            )
        except Exception as exc:
            logger.exception("Failed to send email")
            raise EmailSendError(f"Failed to send email: {exc}") from exc

        return {
            "sent": True,
            "simulated": False,
            "from": from_email,
            "to": to_email,
            "subject": subject,
            "body": final_body,
        }

    def _send_smtp(self, from_email: str, to_email: str, subject: str, body: str) -> None:
        message = MIMEMultipart()
        message["From"] = from_email
        message["To"] = to_email
        message["Subject"] = subject
        message.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(self._settings.smtp_host, self._settings.smtp_port, timeout=30) as server:
            if self._settings.smtp_use_tls:
                server.starttls()
            if self._settings.smtp_username:
                server.login(self._settings.smtp_username, self._settings.smtp_password)
            server.sendmail(from_email, [to_email], message.as_string())
