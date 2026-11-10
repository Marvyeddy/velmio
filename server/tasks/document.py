import asyncio
import uuid
from datetime import UTC, datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from server.ai.rag.vectorstore import (
    delete_document_vectors,
    index_document,
)
from server.celery_app import celery_app
from server.core.config import config as cfg
from server.core.logging import get_app_logger
from server.external.cloudinary import download_document_from_cloudinary
from server.models.document import Document, DocumentStatus
from server.services.documents import process_document_bytes
from server.tasks.exceptions import PermanentDocumentError


logger = get_app_logger(__name__)


class DocumentCleanupError(Exception):
    """Vector cleanup failed; manual recovery is required."""


class DocumentAttemptLost(Exception):
    """The worker no longer owns this document."""


async def process_document_async(
    document_id: str,
    *,
    final_attempt: bool = False,
):
    document_uuid = uuid.UUID(document_id)
    attempt_id = uuid.uuid4()

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
            # STEP 1: Atomically claim a pending document.
            async with session.begin():
                result = await session.execute(
                    select(Document)
                    .where(Document.id == document_uuid)
                    .with_for_update()
                )

                document = result.scalar_one_or_none()

                if document is None:
                    logger.warning(
                        "Document %s not found",
                        document_uuid,
                    )
                    return

                if document.status != DocumentStatus.PENDING:
                    logger.info(
                        "Skipping document %s: status=%s",
                        document_uuid,
                        document.status,
                    )
                    return

                document.status = DocumentStatus.PROCESSING
                document.processing_attempt_id = attempt_id
                document.processing_started_at = datetime.now(UTC)
                document.processing_attempts += 1

                # Save values needed after the transaction.
                public_id = document.cloudinary_public_id
                filename = document.filename
                file_type = document.file_type
                user_id = document.user_id

            chunk_count = 0

            try:
                # STEP 2: Download the original document.
                if not public_id:
                    raise PermanentDocumentError(
                        "Document has no Cloudinary public ID."
                    )

                file_bytes = await download_document_from_cloudinary(public_id)

                # STEP 3: Extract text and split into chunks.
                chunks, document_units = await process_document_bytes(
                    file_bytes=file_bytes,
                    filename=filename,
                    extension=f".{file_type}",
                )

                chunk_count = len(chunks)

                if chunk_count == 0:
                    raise PermanentDocumentError(
                        "Document contains no extractable text."
                    )

                logger.info(
                    "Document %s: units=%s, chunks=%s",
                    document_uuid,
                    document_units,
                    chunk_count,
                )

                # STEP 4: Index document in Pinecone.
                await index_document(
                    chunks=chunks,
                    document_id=document_uuid,
                    user_id=user_id,
                )

                # STEP 5: Complete only if this attempt still owns it.
                result = await session.execute(
                    update(Document)
                    .where(
                        Document.id == document_uuid,
                        Document.status == DocumentStatus.PROCESSING,
                        Document.processing_attempt_id == attempt_id,
                    )
                    .values(
                        status=DocumentStatus.COMPLETED,
                        chunk_count=chunk_count,
                        processing_started_at=None,
                        processing_attempt_id=None,
                    )
                )

                if result.rowcount != 1:
                    await session.rollback()
                    raise DocumentAttemptLost("Document processing ownership changed.")

                await session.commit()

                logger.info(
                    "Document %s indexed successfully",
                    document_uuid,
                )

            except Exception as exc:
                logger.exception(
                    "Processing failed for document %s",
                    document_uuid,
                )

                await session.rollback()

                # Clean up all expected vector IDs.
                try:
                    if chunk_count:
                        await delete_document_vectors(
                            document_id=document_uuid,
                            chunk_count=chunk_count,
                        )

                except Exception as cleanup_exc:
                    logger.exception(
                        "Vector cleanup failed for %s",
                        document_uuid,
                    )

                    # Leave PROCESSING in place. Do not retry
                    # until cleanup has been reconciled.
                    raise DocumentCleanupError(
                        "Document vectors could not be cleaned up."
                    ) from cleanup_exc

                # Do not let an old attempt change a newer state.
                if isinstance(exc, DocumentAttemptLost):
                    raise

                is_permanent = isinstance(exc, PermanentDocumentError)

                next_status = (
                    DocumentStatus.FAILED
                    if is_permanent or final_attempt
                    else DocumentStatus.PENDING
                )

                result = await session.execute(
                    update(Document)
                    .where(
                        Document.id == document_uuid,
                        Document.status == DocumentStatus.PROCESSING,
                        Document.processing_attempt_id == attempt_id,
                    )
                    .values(
                        status=next_status,
                        chunk_count=0,
                        processing_started_at=None,
                        processing_attempt_id=None,
                    )
                )

                if result.rowcount != 1:
                    await session.rollback()
                    raise DocumentAttemptLost(
                        "Document processing ownership changed."
                    ) from exc

                await session.commit()
                raise

    finally:
        await engine.dispose()


@celery_app.task(
    bind=True,
    name="documents.process",
    max_retries=3,
)
def process_document(self, document_id: str):
    final_attempt = self.request.retries >= self.max_retries

    try:
        asyncio.run(
            process_document_async(
                document_id,
                final_attempt=final_attempt,
            )
        )

    except (
        PermanentDocumentError,
        DocumentCleanupError,
        DocumentAttemptLost,
    ):
        # Do not automatically retry permanent errors,
        # unsafe cleanup failures, or ownership conflicts.
        raise

    except Exception as exc:
        if final_attempt:
            raise

        delay = min(
            30 * (2**self.request.retries),
            300,
        )

        raise self.retry(
            exc=exc,
            countdown=delay,
        )
