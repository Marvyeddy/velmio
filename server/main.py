from contextlib import asynccontextmanager
from fastapi import FastAPI
import sys
import asyncio

from server.ai.agent import create_agent
from server.ai.memory import create_ai_memory
from server.errors import require_error
from server.router.auth import auth_router
from server.router.chat import chat_router
from server.router.conversations import conversation_router
from server.router.documents import document_router

version = "v1"


if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with create_ai_memory() as (checkpointer, store):
        app.state.agent = create_agent(checkpointer=checkpointer, store=store)

        yield


app = FastAPI(
    title="Velmio",
    description="A chat agent like chatgpt",
    version="v1.0.0",
    docs_url=f"/api/{version}/docs",
    redoc_url=f"/api/{version}/redoc",
    openapi_url=f"/api/{version}/openapi.json",
    license_info={
        "name": "MIT",
        "url": "https://opensource.org",
    },
    lifespan=lifespan,
)

require_error(app)


@app.get("/root")
async def root():
    return {"message": "Welcome Velmio"}


app.include_router(auth_router, prefix=f"/api/{version}/auth", tags=["Auth"])
app.include_router(chat_router, prefix=f"/api/{version}/chat", tags=["Chat"])
app.include_router(
    conversation_router, prefix=f"/api/{version}/conversations", tags=["Conversations"]
)
app.include_router(
    document_router, prefix=f"/api/{version}/documents", tags=["Documents"]
)
