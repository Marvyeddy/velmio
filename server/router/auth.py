from typing import Annotated
from fastapi import APIRouter, BackgroundTasks, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from server.controllers.auth import (
    forgot_password_controller,
    resend_email_verification_controller,
    signin_controller,
    signup_controller,
    verify_email_controller,
)
from server.external.database import get_session
from server.schemas.users import EmailRequest, UserCreate, UserLogin


auth_router = APIRouter()


@auth_router.post("/signup", status_code=201)
async def signup_router(
    bg: BackgroundTasks,
    user_data: UserCreate,
    session: Annotated[AsyncSession, Depends(get_session)],
):

    return await signup_controller(bg, user_data, session)


@auth_router.get("/verify-email")
async def verify_email_router(
    token: Annotated[str, Query(...)],
    session: Annotated[AsyncSession, Depends(get_session)],
):

    return await verify_email_controller(token, session)


@auth_router.post("/signin")
async def signin_router(
    user_data: UserLogin, session: Annotated[AsyncSession, Depends(get_session)]
):

    return await signin_controller(user_data, session)


@auth_router.post("/resend-email-verification")
async def resend_email_verification_router(
    bg: BackgroundTasks,
    email: EmailRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
):

    return await resend_email_verification_controller(bg, email, session)


@auth_router.post("/forgot-password")
async def forgot_password_router(
    bg: BackgroundTasks,
    email: EmailRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
):

    return await forgot_password_controller(bg, email, session)
