from typing import Any
import uuid
import jwt
from datetime import UTC, datetime, timedelta

from jwt.exceptions import InvalidSignatureError
from server.constants import REFRESH_EXPIRY, SESSION_EXPIRY
from server.core.config import config as cfg
from server.core.logging import get_app_logger

logger = get_app_logger(__name__)


def create_token_data(data: dict, token_type: str, expiry: int):

    data_copy = data.copy()

    expiry_period = datetime.now(UTC) + timedelta(seconds=expiry)

    data_copy.update(
        {"type": token_type, "exp": expiry_period, "jti": str(uuid.uuid4())}
    )

    return jwt.encode(payload=data_copy, key=cfg.JWT_KEY, algorithm=cfg.JWT_ALG)


def create_session(data: dict):

    return create_token_data(data=data, token_type="session", expiry=SESSION_EXPIRY)


def create_refresh(data: dict):

    return create_token_data(data=data, token_type="refresh", expiry=REFRESH_EXPIRY)


def decode_token(token: str) -> dict[str, Any] | None:

    try:
        token_data = jwt.decode(jwt=token, key=cfg.JWT_KEY, algorithms=[cfg.JWT_ALG])
        return token_data
    except InvalidSignatureError as e:
        logger.error("Invalid signature decoding token: %s", str(e))
        return None
    except jwt.ExpiredSignatureError as e:
        logger.error("Token has expired: %s", str(e))
        return None
    except jwt.DecodeError as e:
        logger.error("Failed to decode token: %s", str(e))
        return None
