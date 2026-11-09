import uuid
from fastapi import Request
from langchain_core.messages import AIMessage, HumanMessage
from sqlalchemy.ext.asyncio import AsyncSession
from server.errors import ConversationNotFound
from server.models.user import User
from server.schemas.chat import ConversationDetailResponse, ConversationMessage
from server.services.conversation import conversation_service


async def list_conversations_controller(user: User, session: AsyncSession):
    return await conversation_service.get_user_conversations(
        user_id=user.id, session=session
    )


async def get_conversation_controller(
    conversation_id: uuid.UUID, user: User, session: AsyncSession, request: Request
) -> ConversationDetailResponse:

    conversation = await conversation_service.get_conversation(
        conversation_id=conversation_id, user_id=user.id, session=session
    )

    if conversation is None:
        raise ConversationNotFound()

    agent = request.app.state.agent

    config = {"configurable": {"thread_id": str(conversation.id)}}

    snapshot = await agent.aget_state(config)

    messages = []

    for message in snapshot.values.get("messages", []):
        if not isinstance(message, (HumanMessage, AIMessage)):
            continue

        role = "user" if isinstance(message, HumanMessage) else "assistant"

        text = message.text

        if callable(text):
            return text()

        if not text:
            continue

        messages.append(
            ConversationMessage(
                role=role,
                content=text,
            )
        )

    return ConversationDetailResponse(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=messages,
    )
