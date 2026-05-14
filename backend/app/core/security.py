from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
from jose import JWTError, jwt

from app.core.config import get_settings


def _bcrypt_secret(plain: str) -> bytes:
    """Bcrypt only considers the first 72 bytes; bcrypt 4.1+ errors if longer."""
    secret = plain.encode("utf-8")
    return secret[:72] if len(secret) > 72 else secret


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_bcrypt_secret(plain), hashed.encode("ascii"))
    except (ValueError, OSError):
        return False


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(_bcrypt_secret(plain), bcrypt.gensalt()).decode("ascii")


def create_access_token(subject: str, extra_claims: dict[str, Any] | None = None) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload: dict[str, Any] = {"sub": subject, "exp": expire}
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError as exc:
        raise ValueError("Invalid token") from exc
