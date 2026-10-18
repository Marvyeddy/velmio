from typing import Annotated
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import EmailStr
from backend.core.config import config as cfg
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.security import (
    create_refresh_token,
    create_session_token,
    create_url_safe_token,
    decode_url_safe_token,
    hash_password,
    unsafely_peek_token_payload,
    verify_password,
)
from backend.error import InvalidUserCredential, UserAlreadyExists
from backend.external.database import get_session
from backend.external.email import send_email
from backend.schema.auth_schema import (
    ResetPasswordSubmitSchema,
    UserLogin,
    UserRegister,
)
from backend.service.auth_service import AuthService

auth_router = APIRouter()
auth_service = AuthService()


@auth_router.post("/signup", status_code=status.HTTP_201_CREATED)
async def create_user(
    bg: BackgroundTasks,
    user_data: UserRegister,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    # check email doesn't exist
    email_exist = await auth_service.get_user_by_email(user_data.email, session)
    username_exist = await auth_service.get_user_by_username(
        user_data.username, session
    )

    if email_exist or username_exist:
        raise UserAlreadyExists

    new_user = await auth_service.create_user(user_data, session)

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

    # send tokens for authorization

    token_dict = {"sub": str(new_user.id), "email": new_user.email}

    session_token = create_session_token(token_dict)
    refresh_token = create_refresh_token(token_dict)

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

    return response


@auth_router.post("/signin")
async def login_user(
    user_data: UserLogin, session: Annotated[AsyncSession, Depends(get_session)]
):
    valid_user = None
    if user_data.email:
        valid_user = await auth_service.get_user_by_email(user_data.email, session)
    elif user_data.username:
        valid_user = await auth_service.get_user_by_username(
            user_data.username, session
        )

    if not valid_user or not verify_password(valid_user.password, user_data.password):
        raise InvalidUserCredential

    # send tokens for authorization

    token_dict = {"sub": str(valid_user.id), "email": valid_user.email}

    session_token = create_session_token(token_dict)
    refresh_token = create_refresh_token(token_dict)

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

    return response


@auth_router.post("/forgot-password")
async def forgot_password(
    bg: BackgroundTasks,
    email: EmailStr,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    user = await auth_service.get_user_by_email(email, session)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Email not found"
        )

    token = create_url_safe_token(data={"id": str(user.id)}, salt=user.password)

    reset_url = f"{cfg.FRONTEND_URL}/reset_password/{token}"

    bg.add_task(
        send_email,
        subject="Reset your Velmio password",
        recipients=[user.email],
        template_name="reset_password.html",
        context={
            "first_name": user.username,
            "reset_url": reset_url,
            "expiry_minutes": 30,
        },
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


@auth_router.post("/reset-password-submit")
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
