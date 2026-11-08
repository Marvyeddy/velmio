from typing import Annotated
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from server.controllers.chat import chat_controller
from server.dependencies.current_user import get_current_user
from server.external.database import get_session
from server.models.user import User
from server.schemas.chat import ChatRequest, ChatResponse

chat_router = APIRouter()


@chat_router.post("", response_model=ChatResponse)
async def chat_route(
    payload: ChatRequest,
    request: Request,
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):

    return await chat_controller(
        payload=payload, request=request, user=user, session=session
    )
