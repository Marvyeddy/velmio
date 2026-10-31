import uuid
import jwt
from datetime import UTC, datetime, timedelta
from server.constants import REFRESH_EXPIRY, SESSION_EXPIRY
from server.core.config import config as cfg


def create_token_data(data: dict, token_type: str, expiry: int):

    data_copy = data.copy()

    expiry_period = datetime.now(UTC) + timedelta(seconds=expiry)

    data_copy.update(
        {"type": token_type, "exp": expiry_period, "jti": str(uuid.uud4())}
    )

    return jwt.encode(payload=data_copy, key=cfg.JWT_KEY, algorithm=cfg.JWT_ALG)


def create_session(data: dict):

    return create_token_data(data=data, token_type="session", expiry=SESSION_EXPIRY)


def create_refresh(data: dict):

    return create_token_data(data=data, token_type="refresh", expiry=REFRESH_EXPIRY)
