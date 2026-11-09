import json
import uuid
from collections.abc import AsyncIterator

from fastapi import Request
from langchain_core.messages import HumanMessage
from sqlalchemy.ext.asyncio import AsyncSession

from server.ai.title import generate_conversation_title
from server.core.logging import get_app_logger
from server.errors import ConversationNotFound
from server.models.user import User
from server.schemas.chat import ChatRequest
from server.services.conversation import conversation_service

from server.external.database import AsyncSessionLocal


logger = get_app_logger(__name__)


def format_sse(data: dict) -> str:
    """Format an event for the Vercel AI SDK UI Message Stream."""
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


def extract_text(chunk) -> str:
    """Extract text from LangChain/Gemini message chunks."""
    text_attr = getattr(chunk, "text", None)

    if callable(text_attr):
        return text_attr()

    if isinstance(text_attr, str):
        return text_attr

    content = getattr(chunk, "content", "")

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
    """
    Validate the conversation and return an AI SDK-compatible
    stream of Gemini responses.
    """

    agent = request.app.state.agent
    user_id = user.id
    is_new_conversation = payload.thread_id is None

    if not is_new_conversation:
        conversation = await conversation_service.get_conversation(
            conversation_id=payload.thread_id,
            user_id=user_id,
            session=session,
        )

        if conversation is None:
            raise ConversationNotFound()

    else:
        conversation = await conversation_service.create_conversation(
            user_id=user_id,
            session=session,
        )

    thread_id = conversation.id

    config = {
        "configurable": {
            "thread_id": str(thread_id),
            "user_id": str(user_id),
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

        yield format_sse(
            {
                "type": "text-start",
                "id": text_id,
            }
        )

        try:
            async for event in agent.astream_events(
                {"messages": [HumanMessage(content=payload.message)]},
                config=config,
                version="v2",
            ):
                # Only process streaming model output.
                if event["event"] != "on_chat_model_stream":
                    continue

                metadata = event.get("metadata", {})

                # Ignore events from other graph nodes.
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
                "Streaming failed for conversation %s",
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

        yield format_sse(
            {
                "type": "text-end",
                "id": text_id,
            }
        )

        if is_new_conversation:
            try:
                title = await generate_conversation_title(payload.message)

                # Use a fresh database session for title updates.
                async with AsyncSessionLocal() as db:
                    saved_conversation = await conversation_service.get_conversation(
                        conversation_id=thread_id,
                        user_id=user_id,
                        session=db,
                    )

                    if saved_conversation is not None:
                        await conversation_service.update_conversation(
                            conversation=saved_conversation,
                            session=db,
                            title=title,
                        )

                        yield format_sse(
                            {
                                "type": "message-metadata",
                                "messageMetadata": {
                                    "threadId": str(thread_id),
                                    "title": title,
                                },
                            }
                        )

            except Exception:
                logger.exception(
                    "Title generation failed for conversation %s",
                    thread_id,
                )

        yield format_sse(
            {
                "type": "finish",
            }
        )

        yield "data: [DONE]\n\n"

    return thread_id, generate_events()
