import uuid

from fastapi import HTTPException, UploadFile, status
from server.ai.rag.vectorstore import delete_document_vectors
from server.services.documents import (
    delete_document_record,
    get_user_document,
    get_user_documents,
)
from sqlalchemy.ext.asyncio import AsyncSession

from server.core.logging import get_app_logger
from server.external.cloudinary import (
    delete_document_from_cloudinary,
    upload_document_to_cloudinary,
)
from server.models.document import DocumentStatus
from server.services.documents import (
    DocumentProcessingError,
    create_document_record,
    update_document_record,
    validate_document,
)
from server.tasks.document import process_document


logger = get_app_logger(__name__)


async def upload_document_controller(
    file: UploadFile,
    user_id: uuid.UUID,
    session: AsyncSession,
):
    # STEP 1: Validate the uploaded document.
    try:
        file_bytes, filename, extension = await validate_document(file)

    except DocumentProcessingError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc

    finally:
        await file.close()

    # STEP 2: Create a PENDING document record.
    document = await create_document_record(
        user_id=user_id,
        filename=filename,
        file_type=extension.lstrip("."),
        file_size=len(file_bytes),
        session=session,
    )

    cloudinary_public_id = None

    try:
        # STEP 3: Upload original file to Cloudinary.
        result = await upload_document_to_cloudinary(
            file_bytes=file_bytes,
            document_id=f"{document.id}{extension}",
        )

        cloudinary_public_id = result["public_id"]

        # STEP 4: Save Cloudinary reference.
        await update_document_record(
            document=document,
            session=session,
            status=DocumentStatus.PENDING,
            cloudinary_public_id=cloudinary_public_id,
        )

        # STEP 5: Queue Celery task.
        process_document.delay(str(document.id))

        logger.info(
            "Document %s queued for processing",
            document.id,
        )

        # STEP 6: Return without waiting for processing.
        return {
            "document_id": str(document.id),
            "filename": filename,
            "status": DocumentStatus.PENDING.value,
            "message": "Document queued for processing.",
        }

    except Exception:
        logger.exception(
            "Failed to upload or queue document %s",
            document.id,
        )

        await session.rollback()

        # Mark the document as FAILED.
        try:
            await update_document_record(
                document=document,
                session=session,
                status=DocumentStatus.FAILED,
            )
        except Exception:
            logger.exception("Failed to update document status")

        # Remove uploaded Cloudinary file if necessary.
        if cloudinary_public_id:
            try:
                await delete_document_from_cloudinary(cloudinary_public_id)
            except Exception:
                logger.exception(
                    "Failed to clean up Cloudinary document %s",
                    document.id,
                )

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to upload or queue document.",
        )


async def get_document_status_controller(
    document_id: uuid.UUID,
    user_id: uuid.UUID,
    session: AsyncSession,
):
    document = await get_user_document(
        document_id=document_id,
        user_id=user_id,
        session=session,
    )

    if document is None or document.status == DocumentStatus.DELETING:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    return {
        "document_id": str(document.id),
        "filename": document.filename,
        "status": document.status.value,
        "chunk_count": document.chunk_count,
    }


async def delete_document_controller(
    document_id: uuid.UUID,
    user_id: uuid.UUID,
    session: AsyncSession,
):
    document = await get_user_document(
        document_id=document_id,
        user_id=user_id,
        session=session,
    )

    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    if document.status in (
        DocumentStatus.PENDING,
        DocumentStatus.PROCESSING,
        DocumentStatus.DELETING,
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Document cannot be deleted in its current state.",
        )

    # Mark the document as deleting.
    await update_document_record(
        document=document,
        session=session,
        status=DocumentStatus.DELETING,
    )

    try:
        # Delete indexed chunks from Pinecone.
        if document.chunk_count > 0:
            await delete_document_vectors(
                document_id=document.id,
                chunk_count=document.chunk_count,
            )

        # Delete the original file from Cloudinary.
        if document.cloudinary_public_id:
            await delete_document_from_cloudinary(document.cloudinary_public_id)

        # Delete PostgreSQL record last.
        await delete_document_record(
            document=document,
            session=session,
        )

        logger.info(
            "Document %s deleted successfully",
            document_id,
        )

        return {
            "message": "Document deleted successfully.",
        }

    except Exception:
        logger.exception(
            "Failed to delete document %s",
            document_id,
        )

        await session.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete document.",
        )


async def list_documents_controller(
    user_id: uuid.UUID,
    session: AsyncSession,
):
    documents = await get_user_documents(
        user_id=user_id,
        session=session,
    )

    return [
        {
            "id": str(document.id),
            "filename": document.filename,
            "file_type": document.file_type,
            "file_size": document.file_size,
            "status": document.status.value,
            "chunk_count": document.chunk_count,
            "created_at": document.created_at.isoformat(),
        }
        for document in documents
    ]
