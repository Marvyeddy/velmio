from langchain_core.messages import BaseMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.store.postgres import AsyncPostgresStore
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


class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]


llm = ChatGoogleGenerativeAI(
    model="gemini-3.5-flash-lite", google_api_key=cfg.GOOGLE_API_KEY
)

tools = [save_user_memory, get_user_memories, update_user_memory, delete_user_memory]

llm_with_tool = llm.bind_tools(tools)


def chatbot(state: AgentState):
    system = SystemMessage(
        content=(
            "You are Velmio, a helpful AI assistant. "
            "You can save, retrieve, update, and delete long-term user memories. "
            "Use save_user_memory for new durable facts and preferences. "
            "Use get_user_memories to find existing memories and their IDs. "
            "Before updating or deleting a memory, retrieve the memories "
            "to identify the correct memory ID. "
            "Use update_user_memory when a user corrects previously saved information. "
            "Use delete_user_memory when a user explicitly asks you to forget "
            "a saved fact. "
            "Never claim a memory was changed unless the tool succeeds. "
            "Never store passwords, tokens, or sensitive personal information."
        )
    )
    response = llm_with_tool.invoke([system, *state["messages"]])
    return {"messages": [response]}


def create_agent(checkpointer: AsyncPostgresSaver, store: AsyncPostgresStore):
    graph = StateGraph(AgentState)

    graph.add_node("chatbot", chatbot)
    graph.add_node("tools", ToolNode(tools))

    graph.add_edge(START, "chatbot")
    graph.add_conditional_edges("chatbot", tools_condition)
    graph.add_edge("tools", "chatbot")

    return graph.compile(checkpointer=checkpointer, store=store)
