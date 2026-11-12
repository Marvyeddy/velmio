from langchain_core.messages import BaseMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.store.postgres import AsyncPostgresStore
from server.ai.tools.rag import search_documents
from server.ai.tools.store import (
    delete_user_memory,
    get_user_memories,
    save_user_memory,
    update_user_memory,
)
from server.core.config import config as cfg
from typing import Annotated, TypedDict
from langgraph.graph.message import add_messages
from langgraph.graph import StateGraph, START
from server.ai.prompt import SYSTEM_PROMPT


class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]


llm = ChatGoogleGenerativeAI(
    model="gemini-3.5-flash-lite", google_api_key=cfg.GOOGLE_API_KEY
)

tools = [
    save_user_memory,
    get_user_memories,
    update_user_memory,
    delete_user_memory,
    search_documents,
]

llm_with_tool = llm.bind_tools(tools)


def chatbot(state: AgentState):
    response = llm_with_tool.invoke([SYSTEM_PROMPT, *state["messages"]])
    return {"messages": [response]}


def create_agent(checkpointer: AsyncPostgresSaver, store: AsyncPostgresStore):
    graph = StateGraph(AgentState)

    tool_node = ToolNode(tools, handle_tool_errors="A tool encountered a problem")

    graph.add_node("chatbot", chatbot)
    graph.add_node("tools", tool_node)

    graph.add_edge(START, "chatbot")
    graph.add_conditional_edges("chatbot", tools_condition)
    graph.add_edge("tools", "chatbot")

    return graph.compile(checkpointer=checkpointer, store=store)
