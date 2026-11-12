from langchain_tavily import TavilySearch
from server.core.config import config as cfg

tavily_tool = TavilySearch(
    api_key=cfg.TAVILY_API_KEY, max_results=4, topic="general", search_depth="basic"
)
