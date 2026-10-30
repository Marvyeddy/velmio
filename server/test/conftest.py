import sys
import asyncio
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from server.core.config import config as cfg
from sqlmodel import SQLModel
from httpx import ASGITransport, AsyncClient

from server.external.database import get_session
from server.main import app


@pytest_asyncio.fixture()
async def async_engine() -> AsyncEngine:
    engine = create_async_engine(
        url=cfg.TEST_DATABASE_URL, echo=False, pool_pre_ping=True
    )

    yield engine

    await engine.dispose()


@pytest_asyncio.fixture()
async def session(async_engine) -> AsyncSession:
    Session = sessionmaker(
        bind=async_engine, class_=AsyncSession, autoflush=False, expire_on_commit=False
    )

    async with Session() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture(autouse=True)
async def test_db(async_engine):
    async with async_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    try:
        yield
    finally:
        async with async_engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.drop_all)


@pytest_asyncio.fixture()
async def client(session) -> AsyncClient:
    async def overide_session():
        return session

    app.dependency_overrides[get_session] = overide_session

    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://localhost") as ac:
        yield ac

    app.dependency_overrides.clear()
