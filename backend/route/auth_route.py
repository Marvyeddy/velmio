from typing import Annotated, Any
from uuid import UUID
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Cookie,
    Depends,
    HTTPException,
    Header,
    status,
)
from fastapi.responses import JSONResponse
from backend.core.config import config as cfg
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.constants import SESSION_TOKEN_EXPIRY
from backend.core.security import (
    create_refresh_token,
    create_session_token,
    create_url_safe_token,
    decode_token,
    decode_url_safe_token,
    unsafely_peek_token_payload,
    verify_password,
)
from backend.error import (
    InvalidUserCredential,
    RefreshTokenException,
    TokenException,
    UserAlreadyExists,
)
from backend.external.database import get_session
from backend.external.email import send_email
from backend.schema.auth_schema import (
    ForgotPassword,
    ResetPasswordSubmitSchema,
    UserLogin,
    UserRegister,
)
from backend.service.auth_service import AuthService
from backend.core.logging import get_app_logger

auth_router = APIRouter()
auth_service = AuthService()

logger = get_app_logger(__name__)


@auth_router.post("/signup", status_code=status.HTTP_201_CREATED)
async def create_user(
    bg: BackgroundTasks,
    user_data: UserRegister,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    logger.info(
        f"Attempting to register user with email: {user_data.email} and username: {user_data.username}"
    )
    email_exist = await auth_service.get_user_by_email(user_data.email, session)
    username_exist = await auth_service.get_user_by_username(
        user_data.username, session
    )

    if email_exist or username_exist:
        logger.warning(
            f"User registration failed - email or username already exists. Email: {user_data.email}, Username: {user_data.username}"
        )
        raise UserAlreadyExists

    new_user = await auth_service.create_user(user_data, session)
    logger.info(f"User created successfully with ID: {new_user.id}")

    bg.add_task(
        send_email,
        subject="Welcome to Velmio! ✨",
        recipients=[new_user.email],
        template_name="welcome.html",
        context={
            "first_name": new_user.username,
            "app_url": cfg.FRONTEND_URL,
        },
    )
    logger.info(f"Welcome email scheduled to be sent to: {new_user.email}")

    # send tokens for authorization

    token_dict = {"sub": str(new_user.id), "email": new_user.email}

    session_token = create_session_token(token_dict)
    refresh_token = create_refresh_token(token_dict)
    logger.debug(f"Session and refresh tokens generated for user ID: {new_user.id}")

    response = JSONResponse(
        content={
            "message": "User registered successfully",
            "session_token": session_token,
            "refresh_token": refresh_token,
        },
        status_code=status.HTTP_201_CREATED,
    )

    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=60 * 60,  # 1 hour
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 2,  # 2 days
        path="/",
    )

    logger.info(
        f"Set cookies for session_token and refresh_token for user ID: {new_user.id}"
    )
    return response


@auth_router.post("/signin")
async def login_user(
    user_data: UserLogin, session: Annotated[AsyncSession, Depends(get_session)]
):
    logger.info(
        f"Signin attempt for email: {getattr(user_data, 'email', None)} or username: {getattr(user_data, 'username', None)}"
    )

    valid_user = None
    if user_data.email:
        valid_user = await auth_service.get_user_by_email(user_data.email, session)
        logger.debug(
            f"Lookup by email completed for {user_data.email}: {'found' if valid_user else 'not found'}"
        )
    elif user_data.username:
        valid_user = await auth_service.get_user_by_username(
            user_data.username, session
        )
        logger.debug(
            f"Lookup by username completed for {user_data.username}: {'found' if valid_user else 'not found'}"
        )

    if not valid_user or not verify_password(valid_user.password, user_data.password):
        logger.warning(
            f"Invalid credentials for signin attempt (email: {getattr(user_data, 'email', None)}, username: {getattr(user_data, 'username', None)})"
        )
        raise InvalidUserCredential

    token_dict = {"sub": str(valid_user.id), "email": valid_user.email}

    session_token = create_session_token(token_dict)
    refresh_token = create_refresh_token(token_dict)

    logger.debug(f"Session and refresh tokens generated for user ID: {valid_user.id}")

    response = JSONResponse(
        content={
            "message": "Login successful",
            "session_token": session_token,
            "refresh_token": refresh_token,
        }
    )

    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        max_age=60 * 60,
        path="/",
        secure=True,
        samesite="lax",
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=60 * 60 * 24 * 2,
        path="/",
        secure=True,
        samesite="lax",
    )

    logger.info(
        f"Set cookies for session_token and refresh_token for user ID: {valid_user.id}"
    )

    return response


@auth_router.post("/forgot-password")
async def forgot_password(
    bg: BackgroundTasks,
    payload: ForgotPassword,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    email = payload.email
    logger.info(f"Password reset requested for email: {email}")
    user = await auth_service.get_user_by_email(email, session)

    if user is None:
        logger.warning(f"Password reset requested for non-existent email: {email}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Email not found"
        )

    token = create_url_safe_token(data={"id": str(user.id)}, salt=user.password)

    reset_url = f"{cfg.FRONTEND_URL}/reset_password/{token}"

    logger.debug(
        f"Generated password reset token and URL for user ID: {user.id}, email: {user.email}"
    )

    bg.add_task(
        send_email,
        subject="Reset your Velmio password",
        recipients=[user.email],
        template_name="reset_password.html",
        context={
            "username": user.username,
            "reset_url": reset_url,
            "expiry_minutes": 30,
        },
    )

    logger.info(
        f"Password reset email scheduled for user ID: {user.id}, email: {user.email}"
    )

    return {"message": "Password reset instructions have been sent to your email."}


# Frontend page restriction
@auth_router.get("/verify-reset-token/{token}")
async def verify_reset_token(
    token: str, session: Annotated[AsyncSession, Depends(get_session)]
):
    payload = unsafely_peek_token_payload(token)
    user_id = payload.get("id")

    user = await auth_service.get_user_by_id(user_id, session)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token target."
        )

    token_data = decode_url_safe_token(
        token=token, salt=user.password, max_age_seconds=1800
    )

    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The reset link is invalid, expired, or has already been used.",
        )

    return {"status": "valid", "user_id": user_id}


@auth_router.post("/reset-password")
async def reset_password_submit(
    body: ResetPasswordSubmitSchema,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    payload = unsafely_peek_token_payload(body.token)
    user_id = payload.get("id")

    user = await auth_service.get_user_by_id(user_id, session)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired link."
        )

    token_data = decode_url_safe_token(
        token=body.token, salt=user.password, max_age_seconds=1800
    )

    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot complete request. Link has expired or already been used.",
        )

    new_password = body.new_password

    await auth_service.update_user(user.id, {"password": new_password}, session)

    return {
        "message": "Password updated successfully. You can now log in with your new password"
    }


@auth_router.get("/refresh")
async def refresh_token(
    session: Annotated[AsyncSession, Depends(get_session)],
    authorization: Annotated[str | None, Header()] = None,
    refresh_cookie: Annotated[str | None, Cookie(alias="refresh_token")] = None,
):
    token = refresh_cookie

    if not token and authorization:
        scheme, _, bearer_token = authorization.parititon(" ")

        if scheme.lower() == "bearer" and bearer_token:
            token = bearer_token

    if not token:
        logger.warning("No refresh token was provided")
        raise TokenException

    token_data = decode_token(token)

    if not token_data:
        logger.warning("Failed to decode refresh token")
        raise TokenException

    if token_data.get("type") != "refresh" or "sub" not in token_data:
        logger.warning("The wrong token was provided")
        raise RefreshTokenException

    user_id = UUID(token_data.get("sub"))

    user = await auth_service.get_user_by_id(user_id, session)

    if not user:
        logger.warning(f"User not found for refresh token: {user_id}")
        raise TokenException

    new_token_dict = {"sub": str(user.id), "email": user.email}

    new_session_token = create_session_token(new_token_dict)
    new_refresh_token = create_refresh_token(new_token_dict)

    response = JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "message": "Token refreshed",
            "session-token": new_session_token,
            "refresh-token": new_refresh_token,
        },
    )

    response.set_cookie(
        key="session_token",
        value=new_session_token,
        max_age=60 * 60,
        path="/",
        secure=True,
        httponly=True,
        samesite="lax",
    )

    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        max_age=60 * 60 * 24 * 2,
        path="/",
        secure=True,
        httponly=True,
        samesite="lax",
    )

    return response


@auth_router.get("/signout")
async def signout(
    authorization: Annotated[str | None, Header()] = None,
    refresh_token: Annotated[str | None, Header()] = None,
    refresh_cookie: Annotated[str | None, Cookie(alias="refresh_token")] = None,
    session_cookie: Annotated[str | None, Cookie(alias="session_token")] = None,
):
    # first remove authorization and header tokens
    logger.info("Logout request received")
    tokens_to_revoke: dict[str, Any] = {}
    if authorization:
        scheme, _, bearer_token = authorization.partition(" ")
        if scheme.lower() == "bearer" and bearer_token:
            token_data = decode_token(bearer_token)

            if token_data:
                token_type = token_data["type"]

                if token_type == "session":
                    tokens_to_revoke[bearer_token] = SESSION_TOKEN_EXPIRY
                elif token_type == "refresh":
                    logger.warning("Refresh token supplied as Authorization token")
                else:
                    logger.warning("Unknown token type supplied during logout")
