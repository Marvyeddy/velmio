from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from server.core.config import config as cfg
from server.core.logging import get_app_logger
from server.utils.ai import extract_text


logger = get_app_logger(__name__)


title_llm = ChatGoogleGenerativeAI(
    google_api_key=cfg.GOOGLE_API_KEY,
    model="gemini-2.5-flash",
    temperature=0.2,
    thinking_budget=0,
    max_output_tokens=50,
)


async def generate_conversation_title(message: str) -> str:
    """Generate a short title from the user's first message."""

    if not message.strip():
        return "New Chat"

    response = await title_llm.ainvoke(
        [
            SystemMessage(
                content=(
                    "Generate a short, descriptive title for a chat "
                    "conversation based on the user's first message. "
                    "Use 3 to 6 words. "
                    "Return only the title, without quotation marks, "
                    "markdown, or explanations."
                )
            ),
            HumanMessage(content=message),
        ]
    )

    title = extract_text(response)

    title = title.strip().strip("\"'#*").strip()

    return title[:255] or "New Chat"
