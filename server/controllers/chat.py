from fastapi import Request
from langchain_core.messages import HumanMessage
from sqlalchemy.ext.asyncio import AsyncSession

from server.ai.title import generate_conversation_title
from server.errors import ConversationNotFound
from server.models.user import User
from server.schemas.chat import ChatRequest, ChatResponse
from server.services.conversation import conversation_service
from server.core.logging import get_app_logger


logger = get_app_logger(__name__)


async def chat_controller(
    payload: ChatRequest,
    user: User,
    session: AsyncSession,
    request: Request,
) -> ChatResponse:

    agent = request.app.state.agent

    is_new_conversation = payload.thread_id is None

    # 1. Retrieve or create conversation.
    if not is_new_conversation:
        conversation = await conversation_service.get_conversation(
            conversation_id=payload.thread_id,
            user_id=user.id,
            session=session,
        )

        if conversation is None:
            raise ConversationNotFound()

    else:
        conversation = await conversation_service.create_conversation(
            user_id=user.id,
            session=session,
        )

    # 2. Configure LangGraph.
    config = {
        "configurable": {
            "thread_id": str(conversation.id),
            "user_id": str(user.id),
        },
        "recursion_limit": 25,
    }

    # 3. Generate AI response.
    result = await agent.ainvoke(
        {"messages": [HumanMessage(content=payload.message)]},
        config=config,
    )

    ai_message = result["messages"][-1]

    # Extract text correctly.
    text = ai_message.text
    response_text = text() if callable(text) else text

    # 4. Generate a title for new conversations.
    if is_new_conversation:
        try:
            title = await generate_conversation_title(payload.message)

            await conversation_service.update_conversation(
                conversation=conversation,
                session=session,
                title=title,
            )

        except Exception:
            logger.exception(
                "Failed to generate title for conversation %s",
                conversation.id,
            )

    # 5. Return response.
    return ChatResponse(
        thread_id=conversation.id,
        response=response_text,
    )
