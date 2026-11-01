from fastapi import BackgroundTasks, Response
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

    user = await auth_service.get_user_by_email(email, session)

    if user is None or not verify_pwd(user.password, password):
        raise InvalidCredentials()

    # token
    token_dict = {"sub": str(user.id), "email": user.email}

    session_token = create_session(token_dict)
    refresh_token = create_refresh(token_dict)

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
    user_id = verifiy_email_verification_token(token)

    if not user_id:
        raise InvalidVerificationToken()

    user = await auth_service.get_user_by_id(user_id, session)

    if not user:
        raise InvalidVerificationToken()

    if user.verified:
        raise EmailAlreadyVerified()

    user.verified = True
    session.add(user)
    await session.commit()
    return JSONResponse(
        status_code=200, content={"message": "Email verified successfully"}
    )
