from langchain_tavily import TavilySearch
from server.core.config import config as cfg
from langchain.tools import tool
from langgraph.config import get_config
from server.core.logging import get_app_logger

logger = get_app_logger(__name__)

MAX_SEARCHES = 2

tavily_tool = TavilySearch(
    tavily_api_key=cfg.TAVILY_API_KEY,
    max_results=4,
    topic="general",
    search_depth="basic",
)


@tool("tavily_search")
async def limited_tavily_search(query: str) -> str:
    """Search the web for current information"""

    config = get_config()
    budget = config["configurable"].get("search_budget")

    if budget is None:
        return "Web search is unavailable for this request."

    async with budget["lock"]:
        if budget["used"] >= MAX_SEARCHES:
            logger.info(
                "Tavily search blocked: limit of %s reached",
                MAX_SEARCHES,
            )
            return (
                "Web search limit reached. "
                "Answer using the search results already available."
            )

    budget["used"] += 1

    logger.info(
        "Executing Tavily search %s/%s: %s",
        budget["used"],
        MAX_SEARCHES,
        query,
    )

    return await tavily_tool.ainvoke({"query": query})
