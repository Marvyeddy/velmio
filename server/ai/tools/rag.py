import uuid

from langchain_core.runnables import RunnableConfig
from langchain_core.tools import tool

from server.ai.rag.vectorstore import search_user_documents
from server.core.logging import get_app_logger


logger = get_app_logger(__name__)


@tool
async def search_documents(
    query: str,
    config: RunnableConfig,
) -> str:
    """Search the authenticated user's uploaded documents."""

    user_id = config.get("configurable", {}).get("user_id")

    if not user_id:
        return "Document search is unavailable for this request."

    try:
        user_uuid = uuid.UUID(str(user_id))

        documents = await search_user_documents(
            query=query,
            user_id=user_uuid,
            limit=5,
        )

        if not documents:
            return "No relevant information was found in your documents."

        results = []

        for index, document in enumerate(documents, start=1):
            filename = document.metadata.get("source", "Unknown document")

            page = document.metadata.get("page")

            page_reference = (
                f"Page {page + 1}" if isinstance(page, int) else "Page unavailable"
            )

            results.append(
                f"Result {index}\n"
                f"Source: {filename}\n"
                f"Location: {page_reference}\n"
                f"Content:\n{document.page_content}"
            )

        return "\n\n---\n\n".join(results)

    except Exception:
        logger.exception("Document retrieval failed")

        return "Document search is temporarily unavailable. Please try again later."
