from langchain_core.messages import BaseMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.store.postgres import AsyncPostgresStore
from server.core.config import config as cfg
from typing import Annotated, TypedDict
from langgraph.graph.message import add_messages
from langgraph.graph import StateGraph, START
from langchain.tools import tool


# tool
@tool
def multiply(a: int, b: int) -> int:
    """This tool multiplies two numbers"""
    return a * b


class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]


llm = ChatGoogleGenerativeAI(
    model="gemini-3.5-flash-lite", google_api_key=cfg.GOOGLE_API_KEY
)

tools = [multiply]

llm_with_tool = llm.bind_tools(tools)


def chatbot(state: AgentState):
    system = SystemMessage(
        content=(
            "You are Velmio, a helpful and intelligent AI assistant."
            "You goal is to create accurate, clear and useful answers."
            "When asked your name, introduce yourself as Velmio."
            "If you don't know something acknowlegde your uncertainty."
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
