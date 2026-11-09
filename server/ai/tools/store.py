import uuid
from typing import Annotated

from langchain_core.runnables import RunnableConfig
from langchain_core.tools import tool
from langgraph.prebuilt import InjectedStore
from langgraph.store.base import BaseStore


@tool
async def save_user_memory(
    fact: str,
    config: RunnableConfig,
    store: Annotated[BaseStore, InjectedStore()],
) -> str:
    """Save a useful, durable fact or preference about the user.

    Use this when the user explicitly asks you to remember
    something or shares a stable preference useful in future chats.
    Do not save passwords, secrets, or sensitive information.
    """
    user_id = config["configurable"]["user_id"]

    namespace = ("users", str(user_id), "memories")
    memory_id = str(uuid.uuid4())

    await store.aput(
        namespace,
        memory_id,
        {"fact": fact},
    )

    return "Memory saved successfully."


@tool
async def get_user_memories(
    config: RunnableConfig,
    store: Annotated[BaseStore, InjectedStore()],
) -> str:
    """Retrieve saved user facts, including their memory IDs.

    Use this before updating or deleting a memory.
    """
    user_id = config["configurable"]["user_id"]
    namespace = ("users", str(user_id), "memories")

    memories = await store.asearch(namespace, limit=20)

    if not memories:
        return "No saved memories found."

    return "\n".join(
        f"Memory ID: {memory.key}\nFact: {memory.value['fact']}" for memory in memories
    )


@tool
async def update_user_memory(
    memory_id: str,
    new_fact: str,
    config: RunnableConfig,
    store: Annotated[BaseStore, InjectedStore()],
) -> str:
    """Update an existing user memory.

    First call get_user_memories to find the correct memory ID.
    Never update a memory belonging to another user.
    """
    user_id = config["configurable"]["user_id"]
    namespace = ("users", str(user_id), "memories")

    existing_memory = await store.aget(namespace, memory_id)

    if existing_memory is None:
        return "Memory not found."

    await store.aput(
        namespace,
        memory_id,
        {"fact": new_fact},
    )

    return "Memory updated successfully."


@tool
async def delete_user_memory(
    memory_id: str,
    config: RunnableConfig,
    store: Annotated[BaseStore, InjectedStore()],
) -> str:
    """Delete a saved memory at the user's request.

    First call get_user_memories to identify the correct memory ID.
    """
    user_id = config["configurable"]["user_id"]
    namespace = ("users", str(user_id), "memories")

    existing_memory = await store.aget(namespace, memory_id)

    if existing_memory is None:
        return "Memory not found."

    await store.adelete(namespace, memory_id)

    return "Memory deleted successfully."
