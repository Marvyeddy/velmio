import uuid

from langchain_core.runnables import RunnableConfig
from langchain_core.tools import tool

from server.ai.rag.vectorstore import search_user_documents


@tool
async def search_documents(
    query: str,
    config: RunnableConfig,
) -> str:
    """
    Search the authenticated user's uploaded documents.

    Use this tool when the user asks questions about
    uploaded PDFs, DOCX files, CSV files, or information
    contained in their documents.
    """

    user_id = config.get("configurable", {}).get("user_id")

    if not user_id:
        return "Document search is unavailable: user context is missing."

    try:
        user_uuid = uuid.UUID(str(user_id))
    except ValueError:
        return "Document search is unavailable: invalid user context."

    documents = await search_user_documents(
        query=query,
        user_id=user_uuid,
        limit=5,
    )

    if not documents:
        return "No relevant information was found in your uploaded documents."

    formatted_results = []

    for index, document in enumerate(documents, start=1):
        filename = document.metadata.get(
            "filename",
            "Unknown document",
        )

        page = document.metadata.get("page")

        source = f"Document: {filename}"

        if page is not None:
            source += f", page {int(page) + 1}"

        formatted_results.append(
            f"[Source {index}]\n{source}\nContent:\n{document.page_content}"
        )

    return "\n\n".join(formatted_results)
