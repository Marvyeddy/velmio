from fastapi import FastAPI
import sys
import asyncio

version = "v1"


if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

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
)


@app.get("/root")
async def root():
    return {"message": "Welcome Velmio"}
