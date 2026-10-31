from typing import Annotated
from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from server.controllers.auth import signup_controller
from server.external.database import get_session
from server.schemas.users import UserCreate

auth_router = APIRouter()


@auth_router.post("/signup", status_code=201)
async def signup_router(
    bg: BackgroundTasks,
    user_data: UserCreate,
    session: Annotated[AsyncSession, Depends(get_session)],
):

    return await signup_controller(bg, user_data, session)
