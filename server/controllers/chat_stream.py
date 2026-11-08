import json
import logging
import uuid
from collections.abc import AsyncIterator

from fastapi import Request
from langchain_core.messages import HumanMessage
from sqlalchemy.ext.asyncio import AsyncSession

from server.errors import ConversationNotFound
from server.models.user import User
from server.schemas.chat import ChatRequest
from server.services.conversation import conversation_service


logger = logging.getLogger(__name__)


def format_sse(data: dict) -> str:
    """Format one Server-Sent Event."""
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


def extract_text(chunk) -> str:
    """Extract text from LangChain message chunks."""
    text_method = getattr(chunk, "text", None)

    if callable(text_method):
        return text_method()

    if isinstance(text_method, str):
        return text_method

    content = chunk.content

    if isinstance(content, str):
        return content

    if isinstance(content, list):
        return "".join(
            block.get("text", "")
            for block in content
            if isinstance(block, dict) and block.get("type") == "text"
        )

    return ""


async def chat_stream_controller(
    payload: ChatRequest,
    user: User,
    session: AsyncSession,
    request: Request,
) -> tuple[uuid.UUID, AsyncIterator[str]]:

    agent = request.app.state.agent

    if payload.thread_id is not None:
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

    thread_id = conversation.id

    config = {
        "configurable": {
            "thread_id": str(thread_id),
            "user_id": str(user.id),
        },
        "recursion_limit": 25,
    }

    async def generate_events() -> AsyncIterator[str]:
        text_id = str(uuid.uuid4())

        yield format_sse(
            {
                "type": "start",
                "messageId": str(uuid.uuid4()),
                "messageMetadata": {
                    "threadId": str(thread_id),
                },
            }
        )

        yield format_sse({"type": "text-start", "id": text_id})

        try:
            async for event in agent.astream_events(
                {"messages": [HumanMessage(content=payload.message)]},
                config=config,
                version="v2",
            ):
                if event["event"] != "on_chat_model_stream":
                    continue
                metadata = event.get("metadata", {})

                if metadata.get("langgraph_node") != "chatbot":
                    continue

                chunk = event["data"]["chunk"]
                content = extract_text(chunk)

                if content:
                    yield format_sse(
                        {
                            "type": "text-delta",
                            "id": text_id,
                            "delta": content,
                        }
                    )
        except Exception:
            logger.exception(
                "Streaming failed for thread %s",
                thread_id,
            )

            yield format_sse(
                {
                    "type": "text-end",
                    "id": text_id,
                }
            )

            yield format_sse(
                {
                    "type": "error",
                    "errorText": "Unable to complete the response.",
                }
            )

            yield "data: [DONE]\n\n"
            return

    return thread_id, generate_events()
