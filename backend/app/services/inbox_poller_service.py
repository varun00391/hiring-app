"""IMAP inbox polling for candidate email replies."""

import asyncio
import contextlib
import email
import imaplib
import logging
from email.header import decode_header

from app.config import Settings
from app.repositories.candidate_repository import CandidateRepository
from app.services.communication_service import CommunicationService

logger = logging.getLogger(__name__)


class InboxPollerService:
    def __init__(
        self,
        settings: Settings,
        candidate_repo: CandidateRepository,
        communication_service: CommunicationService,
    ) -> None:
        self._settings = settings
        self._candidates = candidate_repo
        self._communication = communication_service
        self._processed_uids: set[str] = set()
        self._running = False
        self._task: asyncio.Task | None = None

    async def start(self) -> None:
        if not self._settings.imap_enabled:
            logger.info("IMAP polling disabled")
            return
        self._running = True
        self._task = asyncio.create_task(self._poll_loop())

    async def stop(self) -> None:
        self._running = False
        if self._task:
            self._task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._task

    async def _poll_loop(self) -> None:
        while self._running:
            try:
                await self.poll_once()
            except Exception:
                logger.exception("Inbox poll failed")
            await asyncio.sleep(self._settings.inbox_poll_interval_seconds)

    async def poll_once(self) -> int:
        if not self._settings.imap_enabled:
            return 0

        candidates = await self._candidates.list_all()
        email_map = {(c.email or "").lower(): c.id for c in candidates if c.email}
        if not email_map:
            return 0

        replies = await asyncio.to_thread(self._fetch_unseen_replies, email_map)
        matched = 0
        for reply in replies:
            await self._communication.record_inbound_reply(
                candidate_id=reply["candidate_id"],
                subject=reply["subject"],
                body=reply["body"],
                sender=reply["sender"],
            )
            self._processed_uids.add(reply["uid"])
            matched += 1

        if matched:
            logger.info("Processed %s inbound candidate replies", matched)
        return matched

    def _fetch_unseen_replies(self, email_map: dict[str, str]) -> list[dict]:
        replies: list[dict] = []
        mail = imaplib.IMAP4_SSL(self._settings.imap_host, self._settings.imap_port)
        mail.login(self._settings.imap_username, self._settings.imap_password)
        mail.select(self._settings.imap_mailbox)

        _, data = mail.search(None, "UNSEEN")
        message_ids = data[0].split()

        for num in message_ids:
            uid = num.decode()
            if uid in self._processed_uids:
                continue

            _, msg_data = mail.fetch(num, "(RFC822)")
            msg = email.message_from_bytes(msg_data[0][1])
            sender = self._decode_header(msg.get("From", ""))
            subject = self._decode_header(msg.get("Subject", ""))
            body = self._extract_body(msg)
            sender_email = self._extract_email_address(sender).lower()

            candidate_id = email_map.get(sender_email)
            if not candidate_id:
                continue

            replies.append(
                {
                    "uid": uid,
                    "candidate_id": candidate_id,
                    "subject": subject,
                    "body": body,
                    "sender": sender_email,
                }
            )

        mail.logout()
        return replies

    @staticmethod
    def _decode_header(value: str) -> str:
        parts = decode_header(value)
        decoded = []
        for part, charset in parts:
            if isinstance(part, bytes):
                decoded.append(part.decode(charset or "utf-8", errors="ignore"))
            else:
                decoded.append(part)
        return "".join(decoded)

    @staticmethod
    def _extract_email_address(from_header: str) -> str:
        if "<" in from_header and ">" in from_header:
            return from_header.split("<")[1].split(">")[0].strip()
        return from_header.strip()

    @staticmethod
    def _extract_body(msg: email.message.Message) -> str:
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == "text/plain":
                    payload = part.get_payload(decode=True)
                    if payload:
                        return payload.decode(errors="ignore")
            return ""
        payload = msg.get_payload(decode=True)
        return payload.decode(errors="ignore") if payload else ""
