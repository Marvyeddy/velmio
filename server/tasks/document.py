import asyncio
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from server.celery_app import celery_app
from server.core.config import config as cfg
from server.core.logging import get_app_logger
from server.models.document import Document


logger = get_app_logger(__name__)


async def process_document_async(document_id: str):
    document_uuid = uuid.UUID(document_id)

    engine = create_async_engine(
        url=cfg.DATABASE_URL,
        echo=False,
        future=True,
    )

    session_factory = sessionmaker(
        bind=engine,
        class_=AsyncSession,
        autoflush=False,
        expire_on_commit=False,
    )

    try:
        async with session_factory() as session:
            result = await session.execute(
                select(Document).where(Document.id == document_uuid)
            )

            document = result.scalar_one_or_none()

            if document is None:
                logger.warning(
                    "Document %s not found",
                    document_uuid,
                )
                return

            logger.info(
                "Document found: id=%s, filename=%s, status=%s",
                document.id,
                document.filename,
                document.status,
            )
    finally:
        await engine.dispose()


@celery_app.task(name="documents.process")
def process_document(document_id: str):
    asyncio.run(process_document_async(document_id))
