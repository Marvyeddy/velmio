from typing import Annotated

from fastapi import Depends
from server.dependencies.current_user import get_current_user
from server.errors import EmailNotVerified
from server.models.user import User
from server.core.logging import get_app_logger

logger = get_app_logger(__name__)


async def get_verified_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:

    if not current_user.verified:
        logger.warning(
            "Access denied: Unverified user ID: %s",
            current_user.id,
        )
        raise EmailNotVerified()

    return current_user
