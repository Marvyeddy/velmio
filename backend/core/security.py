# Functions for hashing and verifying passwords
from datetime import datetime, timedelta
from typing import Any
import uuid
from argon2 import PasswordHasher, exceptions
from fastapi import HTTPException, status
import jwt
from backend.core.config import config as cfg
from backend.core.constants import REFRESH_TOKEN_EXPIRY, SESSION_TOKEN_EXPIRY
from backend.core.logging import get_app_logger
from itsdangerous import BadTimeSignature, SignatureExpired, URLSafeTimedSerializer

password_hasher = PasswordHasher()
logger = get_app_logger(__name__)


def hash_password(password: str) -> str:
    """Hash a plain password."""
    return password_hasher.hash(password)


def verify_password(hashed_password: str, password: str) -> bool:
    """Verify a plain password against the given hashed password."""
    try:
        return password_hasher.verify(hashed_password, password)
    except exceptions.VerifyMismatchError:
        return False


# create jwt token and decode jwt token
def create_token(data: dict, token_type: str, expiry: int):
    data_copy = data.copy()

    expiry_period = datetime.now() + timedelta(seconds=expiry)

    data_copy.update(
        {"type": token_type, "exp": expiry_period, "jti": str(uuid.uuid4())}
    )

    return jwt.encode(payload=data_copy, key=cfg.JWT_KEY, algorithm=cfg.JWT_ALG)


def create_session_token(data: dict):
    return create_token(data=data, token_type="session", expiry=SESSION_TOKEN_EXPIRY)


def create_refresh_token(data: dict):
    return create_token(data=data, token_type="refresh", expiry=REFRESH_TOKEN_EXPIRY)


def decode_token(token: str) -> dict[str, Any] | None:
    try:
        token = jwt.decode(jwt=token, key=cfg.JWT_KEY, algorithms=cfg.JWT_ALG)
        return token
    except jwt.InvalidSignatureError as e:
        logger.error("Invalid signature decoding token: %s", str(e))
        return None
    except jwt.ExpiredSignatureError as e:
        logger.error("Token has expired: %s", str(e))
        return None
    except jwt.DecodeError as e:
        logger.error("Failed to decode token: %s", str(e))
        return None


# serialized tokens
def create_url_safe_token(data: dict, salt: str) -> str:
    dynamic_salt = f"password-reset-{salt}"
    serializer = URLSafeTimedSerializer(secret_key=cfg.JWT_KEY, salt=dynamic_salt)
    return serializer.dumps(data)


def decode_url_safe_token(
    token: str, salt: str, max_age_seconds: int = 1800
) -> dict | None:
    dynamic_salt = f"password-reset-{salt}"
    serializer = URLSafeTimedSerializer(secret_key=cfg.JWT_KEY, salt=dynamic_salt)
    try:
        return serializer.loads(token, max_age=max_age_seconds)
    except SignatureExpired:
        logger.warning("Token verification failed: Token timestamp has expired.")
        return None
    except BadTimeSignature:
        logger.warning(
            "Token verification failed: Invalid signature or structural tampering."
        )
        return None


# Frontend restriction from email
def unsafely_peek_token_payload(token: str) -> dict:
    try:
        serializer_vulnerable = URLSafeTimedSerializer(secret_key=cfg.JWT_KEY)
        return serializer_vulnerable.load_payload(token)
    except Exception as e:
        logger.error("Failed to parse token payload layout: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The link structure is invalid.",
        )
