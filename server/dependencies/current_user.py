from typing import Annotated

from fastapi import Cookie, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from server.core.logging import get_app_logger
from server.errors import EmailNotVerified, InvalidToken, UserNotFound
from server.external.blocklist import token_in_blocklist
from server.external.database import get_session
from server.models.user import User
from server.services.auth import AuthService
from server.utils.jwt_token import decode_token


logger = get_app_logger(__name__)

auth_service = AuthService()


async def get_current_user(
    session_token: Annotated[str | None, Cookie(alias="session-token")] = None,
    session: AsyncSession = Depends(get_session),
) -> User:

    if not session_token:
        logger.warning("Authentication failed: No session token provided")
        raise InvalidToken()

    token_data = decode_token(session_token)

    if not token_data:
        logger.warning("Authentication failed: Invalid or expired session token")
        raise InvalidToken()

    if token_data.get("type") != "session":
        logger.warning("Authentication failed: Invalid token type")
        raise InvalidToken()

    user_id = token_data.get("sub")
    jti = token_data.get("jti")

    if not user_id or not isinstance(jti, str) or not jti:
        logger.warning("Authentication failed: Missing JWT claims")
        raise InvalidToken()

    if await token_in_blocklist(jti):
        logger.warning("Authentication failed: Session token has been revoked")
        raise InvalidToken()

    user = await auth_service.get_user_by_id(
        user_id,
        session,
    )

    if not user:
        logger.warning("Authentication failed: User not found")
        raise UserNotFound()

    if not user.is_active:
        logger.warning(
            "Authentication failed: Inactive user ID: %s",
            user.id,
        )
        raise InvalidToken()

    if not user.verified:
        logger.warning("Authentication failed: Unverified user ID: %s", user.id)
        raise EmailNotVerified()

    logger.debug("Authenticated user ID: %s", user.id)

    return user
