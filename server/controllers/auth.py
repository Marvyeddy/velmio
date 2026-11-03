from typing import Any
from fastapi import BackgroundTasks, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from server.constants import REFRESH_EXPIRY, SESSION_EXPIRY
from server.errors import (
    EmailAlreadyVerified,
    InvalidCredentials,
    InvalidToken,
    InvalidVerificationToken,
    UserAlreadyExists,
    UserNotFound,
)
from server.external.blocklist import add_token_to_blocklist, get_remaining_expiry
from server.external.email import send_email
from server.schemas.users import UserCreate, UserLogin
from server.services.auth import AuthService
from server.utils.hashing import verify_pwd
from server.utils.jwt_token import create_refresh, create_session, decode_token
from server.utils.verification_tokens import (
    create_email_verification_token,
    verify_email_verification_token,
)
from server.core.config import config as cfg
from server.core.logging import get_app_logger

auth_service = AuthService()
logger = get_app_logger(__name__)


async def signup_controller(
    bg: BackgroundTasks, user_data: UserCreate, session: AsyncSession
):
    user_dict = user_data.model_dump()
    logger.info(
        f"Signup attempt started for user: {user_dict.get('username')} (Email: {user_dict.get('email')})"
    )

    existing_username = await auth_service.get_user_by_username(
        user_dict["username"], session
    )
    if existing_username:
        logger.warning(
            f"Signup failed: Username '{user_dict['username']}' already exists."
        )
        raise UserAlreadyExists()

    existing_email = await auth_service.get_user_by_email(user_dict["email"], session)
    if existing_email:
        logger.warning(f"Signup failed: Email '{user_dict['email']}' already exists.")
        raise UserAlreadyExists()

    logger.info(f"Creating new user record for: {user_dict['username']}")
    new_user = await auth_service.create_user(user_dict, session)

    token = create_email_verification_token(str(new_user.id))
    verification_url = f"{cfg.FRONTEND_URL}/verify-email?token={token}"

    logger.info(
        f"Scheduling email verification background task for user ID: {new_user.id}"
    )
    bg.add_task(
        send_email,
        subject="Verify your velmio account",
        recipients=[new_user.email],
        template_name="verify_email.html",
        template_context={
            "username": new_user.username,
            "verification_url": verification_url,
            "expiry_minutes": 30,
        },
    )

    # create session and refresh token
    token_dict = {"sub": str(new_user.id), "email": new_user.email}

    session_token = create_session(token_dict)
    refresh_token = create_refresh(token_dict)

    logger.info(f"User {new_user.username} (ID: {new_user.id}) signed up successfully.")
    response = JSONResponse(
        content={"message": "User Signed up successfully"}, status_code=201
    )

    response.set_cookie(
        key="session-token",
        value=session_token,
        max_age=SESSION_EXPIRY,
        httponly=True,
        secure=cfg.COOKIE_SECURE,
        samesite="lax",
    )

    response.set_cookie(
        key="refresh-token",
        value=refresh_token,
        max_age=REFRESH_EXPIRY,
        httponly=True,
        secure=cfg.COOKIE_SECURE,
        samesite="lax",
    )

    return response


async def signin_controller(user_data: UserLogin, session: AsyncSession):

    user_dict = user_data.model_dump()

    email = user_dict["email"]
    password = user_dict["password"]

    logger.info(f"Signin attempt started for email: {email}")

    user = await auth_service.get_user_by_email(email, session)

    if user is None or not verify_pwd(user.password, password):
        logger.warning(f"Signin failed: Invalid credentials for email '{email}'.")
        raise InvalidCredentials()

    # token
    token_dict = {"sub": str(user.id), "email": user.email}

    session_token = create_session(token_dict)
    refresh_token = create_refresh(token_dict)

    logger.info(f"User {user.username} (ID: {user.id}) signed in successfully.")
    response = JSONResponse(
        content={"message": "User logged-in successfully"}, status_code=200
    )

    response.set_cookie(
        key="session-token",
        value=session_token,
        max_age=SESSION_EXPIRY,
        secure=cfg.COOKIE_SECURE,
        httponly=True,
        samesite="lax",
    )

    response.set_cookie(
        key="refresh-token",
        value=refresh_token,
        max_age=REFRESH_EXPIRY,
        secure=cfg.COOKIE_SECURE,
        httponly=True,
        samesite="lax",
    )

    return response


async def verify_email_controller(token: str, session: AsyncSession):

    logger.info("Email verification attempt started.")
    user_id = verify_email_verification_token(token)

    if not user_id:
        logger.warning("Email verification failed: Invalid or expired token.")
        raise InvalidVerificationToken()

    user = await auth_service.get_user_by_id(user_id, session)

    if not user:
        logger.warning(f"Email verification failed: User not found for ID '{user_id}'.")
        raise InvalidVerificationToken()

    if user.verified:
        logger.warning(
            f"Email verification failed: Email already verified for user ID '{user.id}'."
        )
        raise EmailAlreadyVerified()

    user.verified = True
    session.add(user)
    await session.commit()
    logger.info(f"Email verified successfully for user ID: {user.id}")
    return JSONResponse(
        status_code=200, content={"message": "Email verified successfully"}
    )


async def resend_email_verification_controller(
    bg: BackgroundTasks, email: str, session: AsyncSession
):

    logger.info(f"Resend email verification attempt started for email: {email}")
    user = await auth_service.get_user_by_email(email, session)

    if not user:
        logger.warning(
            f"Resend email verification failed: User not found for email '{email}'."
        )
        raise UserNotFound()

    if user.verified:
        logger.warning(
            f"Resend email verification failed: Email already verified for user '{user.username}' (ID: {user.id})."
        )
        raise EmailAlreadyVerified()

    token = create_email_verification_token(str(user.id))
    verification_url = f"{cfg.FRONTEND_URL}/verify-email?token={token}"

    logger.info(f"Scheduling email verification background task for user ID: {user.id}")
    bg.add_task(
        send_email,
        subject="Verify your velmio account",
        recipients=[user.email],
        template_name="verify_email.html",
        template_context={
            "username": user.username,
            "verification_url": verification_url,
            "expiry_minutes": 30,
        },
    )

    logger.info(
        f"Email verification resent successfully for user {user.username} (ID: {user.id})."
    )
    return JSONResponse(
        status_code=200, content={"message": "Email verification resent successfully"}
    )


async def forgot_password_controller(
    bg: BackgroundTasks,
    email: str,
    session: AsyncSession,
):
    logger.info("Password reset requested")

    user = await auth_service.get_user_by_email(email, session)

    if not user:
        logger.info("Password reset request completed for an unregistered email")
        raise UserNotFound()

    token = create_email_verification_token(
        str(user.id),
    )

    reset_url = f"{cfg.FRONTEND_URL}/reset-password?token={token}"

    logger.info(
        "Scheduling password reset email for user ID: %s",
        user.id,
    )

    bg.add_task(
        send_email,
        subject="Reset Your Velmio Password",
        recipients=[user.email],
        template_name="reset_password.html",
        template_context={
            "username": user.username,
            "reset_url": reset_url,
            "expiry_minutes": 30,
        },
    )

    logger.info(
        "Password reset email scheduled for user ID: %s",
        user.id,
    )

    return {"message": "Reset link has been sent to your email"}


async def reset_password_controller(
    password: str,
    token: str,
    session: AsyncSession,
):
    logger.info("Reset password started")

    user_id = verify_email_verification_token(token)

    if not user_id:
        raise InvalidToken()

    user = await auth_service.get_user_by_id(user_id, session)

    if not user:
        logger.warning("Password reset failed: User not found")
        raise UserNotFound()

    # Update password
    await auth_service.update_user(
        user=user,
        user_data={"password": password},
        session=session,
    )
    logger.info("Password reset completed for user ID: %s", user.id)

    return {"message": "Password reset successfully"}


async def refresh_token_controller(
    refresh_token: str,
    session: AsyncSession,
):
    logger.info("Refresh token request received")

    if not refresh_token:
        logger.warning("No refresh token provided")
        raise InvalidToken()

    token_data = decode_token(refresh_token)

    if not token_data:
        logger.warning("Invalid or expired refresh token")
        raise InvalidToken()

    if token_data.get("type") != "refresh":
        logger.warning("Invalid token type for refresh")
        raise InvalidToken()

    user_id = token_data.get("sub")
    jti = token_data.get("jti")

    if not user_id or not jti:
        logger.warning("Refresh token missing required claims")
        raise InvalidToken()

    expiry = get_remaining_expiry(token_data)

    if expiry <= 0:
        raise InvalidToken()

    user = await auth_service.get_user_by_id(
        user_id,
        session,
    )

    if not user or not user.is_active:
        logger.warning("Refresh rejected: invalid or inactive user")
        raise InvalidToken()

    new_token_dict = {
        "sub": str(user.id),
        "email": user.email,
    }

    # Prepare replacement tokens
    new_session_token = create_session(new_token_dict)
    new_refresh_token = create_refresh(new_token_dict)

    consumed = await add_token_to_blocklist(jti, expiry)

    if not consumed:
        logger.warning("Refresh token already used or revoked")
        raise InvalidToken()

    response = JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "message": "Session and refresh tokens refreshed",
        },
    )

    response.set_cookie(
        key="session-token",
        value=new_session_token,
        max_age=SESSION_EXPIRY,
        path="/",
        samesite="lax",
        httponly=True,
        secure=cfg.COOKIE_SECURE,
    )

    response.set_cookie(
        key="refresh-token",
        value=new_refresh_token,
        max_age=REFRESH_EXPIRY,
        path="/",
        samesite="lax",
        httponly=True,
        secure=cfg.COOKIE_SECURE,
    )

    logger.info(
        "Tokens refreshed successfully for user ID: %s",
        user.id,
    )

    return response


async def signout_controller(
    session_token: str | None,
    refresh_token: str | None,
):
    logger.info("Signout request received")

    tokens_to_revoke: dict[str, int] = {}

    for token, expected_type in (
        (session_token, "session"),
        (refresh_token, "refresh"),
    ):
        if not token:
            continue

        token_data = decode_token(token)

        if not token_data:
            continue

        if token_data.get("type") != expected_type:
            continue

        jti = token_data.get("jti")

        if not jti:
            continue

        expiry = get_remaining_expiry(token_data)

        if expiry > 0:
            tokens_to_revoke[jti] = expiry

    for jti, expiry in tokens_to_revoke.items():
        await add_token_to_blocklist(jti, expiry)

    response = JSONResponse(
        content={"message": "Logged out successfully"},
        status_code=status.HTTP_200_OK,
    )

    response.delete_cookie(
        key="session-token",
    )

    response.delete_cookie(
        key="refresh-token",
    )

    logger.info(
        "Logout successful. revoked_tokens=%s",
        len(tokens_to_revoke),
    )

    return response
