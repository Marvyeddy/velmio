from fastapi import FastAPI
import sys
import asyncio

from backend.error import require_error
from backend.middleware import require_middleware
from backend.route.auth_route import auth_router

version = "v1"

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

app = FastAPI(
    title="Velmio",
    description=(
        "Velmio is an AI-powered conversational platform that offers:\n"
        "- Intelligent conversations\n"
        "- Persistent chat history\n"
        "- Document-based question answering using Retrieval-Augmented Generation (RAG)\n\n"
        "Technologies: FastAPI, PostgreSQL, and ChromaDB.\n"
        "Velmio is designed for security, scalability, and production-ready deployment."
    ),
    version="1.0.0",
    contact={
        "name": "Velmio Support",
        "email": "marvelousanyatonwu4@gmail.com",
    },
    license={"name": "MIT"},
    redoc_url=f"/api/{version}/redoc",
    docs_url=f"/api/{version}/docs",
    openapi_url=f"/api/{version}/openapi.json",
)

require_error(app)
require_middleware(app)


@app.get("/")
async def root():
    return {"message": "Hello Velmio"}


app.include_router(auth_router, prefix=f"/api/{version}/auth", tags=["Auth"])
