from fastapi import BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from server.constants import REFRESH_EXPIRY, SESSION_EXPIRY
from server.errors import (
    EmailAlreadyVerified,
    InvalidCredentials,
    InvalidVerificationToken,
    UserAlreadyExists,
    UserNotFound,
)
from server.external.email import send_email
from server.schemas.users import UserCreate, UserLogin
from server.services.auth import AuthService
from server.utils.hashing import verify_pwd
from server.utils.jwt_token import create_refresh, create_session
from server.utils.verification_tokens import (
    create_email_verification_token,
    verifiy_email_verification_token,
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
        secure=True,
        samesite="lax",
    )

    response.set_cookie(
        key="refresh-token",
        value=refresh_token,
        max_age=REFRESH_EXPIRY,
        httponly=True,
        secure=True,
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
        path="/",
        max_age=SESSION_EXPIRY,
        secure=True,
        httponly=True,
        samesite="lax",
    )

    response.set_cookie(
        key="refresh-token",
        value=refresh_token,
        path="/",
        max_age=REFRESH_EXPIRY,
        secure=True,
        httponly=True,
        samesite="lax",
    )

    return response


async def verify_email_controller(token: str, session: AsyncSession):
    logger.info("Email verification attempt started.")
    user_id = verifiy_email_verification_token(token)

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
