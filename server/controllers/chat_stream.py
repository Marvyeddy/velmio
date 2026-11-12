import asyncio
import json
import uuid
from collections.abc import AsyncIterator

from fastapi import Request
from langchain_core.messages import HumanMessage
from sqlalchemy.ext.asyncio import AsyncSession

from server.ai.title import generate_conversation_title
from server.core.logging import get_app_logger
from server.errors import ConversationNotFound
from server.external.database import AsyncSessionLocal
from server.models.user import User
from server.schemas.chat import ChatRequest
from server.services.conversation import conversation_service


logger = get_app_logger(__name__)

MODEL_NODE = "chatbot"

TOOL_LABELS = {
    "search_documents": "Searching your documents",
    "save_user_memory": "Saving memory",
    "get_user_memories": "Retrieving memories",
    "update_user_memory": "Updating memory",
    "delete_user_memory": "Deleting memory",
    "tavily_search_results_json": "Searching the web",
    "tavily_search": "Searching the web",
}


def format_sse(data: dict) -> str:
    """Format an AI SDK UI Message Stream event."""
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


def extract_text(chunk) -> str:
    """Extract text from LangChain/Gemini streaming chunks."""
    text_attr = getattr(chunk, "text", None)

    if callable(text_attr):
        value = text_attr()
        if isinstance(value, str):
            return value
    elif isinstance(text_attr, str):
        return text_attr

    content = getattr(chunk, "content", "")

    if isinstance(content, str):
        return content

    if isinstance(content, list):
        return "".join(
            block.get("text", "")
            for block in content
            if isinstance(block, dict)
            and block.get("type") == "text"
            and isinstance(block.get("text"), str)
        )

    return ""


async def chat_stream_controller(
    payload: ChatRequest,
    user: User,
    session: AsyncSession,
    request: Request,
) -> tuple[uuid.UUID, AsyncIterator[str]]:
    """
    Validate conversation ownership and return a streaming
    AI SDK-compatible Gemini response.
    """

    agent = request.app.state.agent
    user_id = user.id
    is_new_conversation = payload.thread_id is None

    # STEP 1: Validate or create conversation.
    if is_new_conversation:
        conversation = await conversation_service.create_conversation(
            user_id=user_id,
            session=session,
        )
    else:
        conversation = await conversation_service.get_conversation(
            conversation_id=payload.thread_id,
            user_id=user_id,
            session=session,
        )

        if conversation is None:
            raise ConversationNotFound()

    thread_id = conversation.id

    config = {
        "configurable": {
            "thread_id": str(thread_id),
            "user_id": str(user_id),
        },
        "recursion_limit": 25,
    }

    async def generate_events() -> AsyncIterator[str]:
        text_id = None
        active_tools: dict[str, str] = {}
        completed = False

        # STEP 2: Start the assistant message.
        yield format_sse(
            {
                "type": "start",
                "messageId": str(uuid.uuid4()),
                "messageMetadata": {
                    "threadId": str(thread_id),
                },
            }
        )

        try:
            # STEP 3: Stream LangGraph events.
            async for event in agent.astream_events(
                {"messages": [HumanMessage(content=payload.message)]},
                config=config,
                version="v2",
            ):
                event_type = event.get("event")
                event_name = event.get("name", "")
                run_id = str(event.get("run_id", ""))

                # -----------------------------------------
                # TOOL START
                # -----------------------------------------
                if event_type == "on_tool_start":
                    if event_name not in TOOL_LABELS:
                        continue

                    active_tools[run_id] = event_name

                    yield format_sse(
                        {
                            "type": "data-tool-status",
                            "id": run_id,
                            "data": {
                                "tool": event_name,
                                "label": TOOL_LABELS[event_name],
                                "status": "running",
                            },
                        }
                    )
                    continue

                # -----------------------------------------
                # TOOL COMPLETED
                # -----------------------------------------
                if event_type == "on_tool_end":
                    tool_name = active_tools.pop(run_id, None)

                    if tool_name is None:
                        continue

                    yield format_sse(
                        {
                            "type": "data-tool-status",
                            "id": run_id,
                            "data": {
                                "tool": tool_name,
                                "label": TOOL_LABELS[tool_name],
                                "status": "completed",
                            },
                        }
                    )
                    continue

                # -----------------------------------------
                # TOOL ERROR
                # -----------------------------------------
                if event_type == "on_tool_error":
                    tool_name = active_tools.pop(run_id, None)

                    if tool_name is None:
                        continue

                    yield format_sse(
                        {
                            "type": "data-tool-status",
                            "id": run_id,
                            "data": {
                                "tool": tool_name,
                                "label": TOOL_LABELS[tool_name],
                                "status": "failed",
                            },
                        }
                    )
                    continue

                # -----------------------------------------
                # GEMINI TEXT STREAM
                # -----------------------------------------
                if event_type != "on_chat_model_stream":
                    continue

                metadata = event.get("metadata", {})

                if metadata.get("langgraph_node") != MODEL_NODE:
                    continue

                chunk = event.get("data", {}).get("chunk")

                if chunk is None:
                    continue

                content = extract_text(chunk)

                if not content:
                    continue

                # Open a text segment only when needed.
                if text_id is None:
                    text_id = str(uuid.uuid4())

                    yield format_sse(
                        {
                            "type": "text-start",
                            "id": text_id,
                        }
                    )

                yield format_sse(
                    {
                        "type": "text-delta",
                        "id": text_id,
                        "delta": content,
                    }
                )

            completed = True

        except asyncio.CancelledError:
            logger.info(
                "Chat stream cancelled for conversation %s",
                thread_id,
            )
            raise

        except Exception:
            logger.exception(
                "Streaming failed for conversation %s",
                thread_id,
            )

            # Report unfinished tools as failed.
            for run_id, tool_name in active_tools.items():
                yield format_sse(
                    {
                        "type": "data-tool-status",
                        "id": run_id,
                        "data": {
                            "tool": tool_name,
                            "label": TOOL_LABELS[tool_name],
                            "status": "failed",
                        },
                    }
                )

            if text_id is not None:
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

        # STEP 4: Close text segment.
        if text_id is not None:
            yield format_sse(
                {
                    "type": "text-end",
                    "id": text_id,
                }
            )

        # STEP 5: Generate title for new conversations.
        if completed and is_new_conversation:
            try:
                title = await asyncio.wait_for(
                    generate_conversation_title(payload.message),
                    timeout=15,
                )

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

            except asyncio.CancelledError:
                raise

            except Exception:
                logger.exception(
                    "Title generation failed for conversation %s",
                    thread_id,
                )

        # STEP 6: Finish the AI SDK message.
        yield format_sse({"type": "finish"})
        yield "data: [DONE]\n\n"

    return thread_id, generate_events()
