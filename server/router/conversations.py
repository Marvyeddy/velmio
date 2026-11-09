from typing import Annotated
import uuid
from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from server.controllers.conversations import (
    delete_conversation_controller,
    get_conversation_controller,
    list_conversations_controller,
    rename_conversation_controller,
)
from server.dependencies.current_user import get_current_user
from server.external.database import get_session
from server.models.user import User
from server.schemas.chat import (
    ConversationDetailResponse,
    ConversationResponse,
    ConversationUpdate,
)

conversation_router = APIRouter()


@conversation_router.get("", response_model=ConversationResponse)
async def list_conversations(
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):

    return await list_conversations_controller(user=user, session=session)


@conversation_router.get(
    "/{conversation_id}",
    response_model=ConversationDetailResponse,
)
async def get_conversation(
    conversation_id: uuid.UUID,
    request: Request,
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    return await get_conversation_controller(
        conversation_id=conversation_id,
        user=user,
        session=session,
        request=request,
    )


@conversation_router.patch(
    "/{conversation_id}",
    response_model=ConversationResponse,
)
async def rename_conversation(
    conversation_id: uuid.UUID,
    payload: ConversationUpdate,
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    return await rename_conversation_controller(
        conversation_id=conversation_id,
        payload=payload,
        user=user,
        session=session,
    )


@conversation_router.delete(
    "/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_conversation(
    conversation_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    await delete_conversation_controller(
        conversation_id=conversation_id,
        user=user,
        session=session,
    )

    return Response(status_code=status.HTTP_204_NO_CONTENT)
