from contextlib import asynccontextmanager
from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool
from server.core.config import config as cfg
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.store.postgres.aio import AsyncPostgresStore


@asynccontextmanager
async def create_ai_memory():
    pool = AsyncConnectionPool(
        conninfo=cfg.LANGGRAPH_URL,
        min_size=1,
        max_size=10,
        kwargs={
            "autocommit": True,
            "row_factory": dict_row,
        },
        open=False,
    )

    async with pool:
        checkpointer = AsyncPostgresSaver(pool)
        store = AsyncPostgresStore(pool)

        await checkpointer.setup()
        await store.setup()

        yield checkpointer, store
