from fastapi import Request
from langchain_core.messages import HumanMessage
from sqlalchemy.ext.asyncio import AsyncSession
from server.errors import ConversationNotFound
from server.models.user import User
from server.schemas.chat import ChatRequest, ChatResponse
from server.services.conversation import conversation_service


async def chat_controller(
    payload: ChatRequest, user: User, session: AsyncSession, request: Request
):

    agent = request.app.state.agent

    if payload.thread_id is not None:
        conversation = await conversation_service.get_conversation(
            conversation_id=payload.thread_id, user_id=user.id, session=session
        )

        if conversation is None:
            raise ConversationNotFound()
    else:
        conversation = await conversation_service.create_conversation(
            user_id=user.id, session=session
        )

    config = {
        "configurable": {"thread_id": str(conversation.id)},
        "recursion_limit": 25,
    }

    result = await agent.ainvoke(
        {"messages": [HumanMessage(content=payload.message)]},
        config=config,
    )

    ai_message = result["messages"][-1]

    return ChatResponse(thread_id=conversation.id, response=str(ai_message.content))
