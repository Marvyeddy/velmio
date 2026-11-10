import uuid

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from server.ai.rag.vectorstore import (
    delete_document_vectors,
    index_document,
)
from server.core.logging import get_app_logger
from server.external.cloudinary import (
    delete_document_from_cloudinary,
    upload_document_to_cloudinary,
)
from server.models.document import DocumentStatus
from server.schemas.documents import DocumentResponse
from server.services.documents import (
    DocumentProcessingError,
    create_document_record,
    delete_document_record,
    get_user_document,
    get_user_documents,
    process_document_bytes,
    update_document_record,
    validate_document,
)


logger = get_app_logger(__name__)


async def upload_document_controller(
    file: UploadFile,
    user_id: uuid.UUID,
    session: AsyncSession,
):
    try:
        file_bytes, filename, extension = await validate_document(file)
    except DocumentProcessingError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc
    finally:
        await file.close()

    document = await create_document_record(
        user_id=user_id,
        filename=filename,
        file_type=extension.lstrip("."),
        file_size=len(file_bytes),
        session=session,
    )

    cloudinary_public_id = None
    chunk_count = 0

    try:
        # Upload original document.
        result = await upload_document_to_cloudinary(
            file_bytes=file_bytes,
            document_id=str(document.id),
        )

        cloudinary_public_id = result["public_id"]

        await update_document_record(
            document=document,
            session=session,
            status=DocumentStatus.PROCESSING,
            cloudinary_public_id=cloudinary_public_id,
        )

        # Extract and split document.
        chunks, document_units = await process_document_bytes(
            file_bytes=file_bytes,
            filename=filename,
            extension=extension,
        )

        chunk_count = len(chunks)

        if chunk_count == 0:
            raise DocumentProcessingError("The document contains no extractable text.")

        # Generate embeddings and index in Pinecone.
        await index_document(
            chunks=chunks,
            document_id=document.id,
            user_id=user_id,
        )

        # Mark completed only after successful indexing.
        await update_document_record(
            document=document,
            session=session,
            status=DocumentStatus.COMPLETED,
            chunk_count=chunk_count,
        )

        logger.info(
            "Document %s indexed successfully with %s chunks",
            document.id,
            chunk_count,
        )

        return {
            "document_id": str(document.id),
            "filename": filename,
            "file_type": extension.lstrip("."),
            "document_units": document_units,
            "chunk_count": chunk_count,
            "status": DocumentStatus.COMPLETED.value,
            "message": "Document uploaded and indexed successfully.",
        }

    except Exception as exc:
        logger.exception(
            "Document processing failed: %s",
            document.id,
        )

        await session.rollback()

        # Remove any partially indexed vectors.
        if chunk_count:
            try:
                await delete_document_vectors(
                    document_id=document.id,
                    chunk_count=chunk_count,
                )
            except Exception:
                logger.exception(
                    "Pinecone cleanup failed for document %s",
                    document.id,
                )

        # Remove original file if it was uploaded.
        if cloudinary_public_id:
            try:
                await delete_document_from_cloudinary(cloudinary_public_id)
            except Exception:
                logger.exception(
                    "Cloudinary cleanup failed for document %s",
                    document.id,
                )

        # Mark database record as failed.
        try:
            await update_document_record(
                document=document,
                session=session,
                status=DocumentStatus.FAILED,
            )
        except Exception:
            logger.exception(
                "Failed to update status for document %s",
                document.id,
            )

        if isinstance(exc, DocumentProcessingError):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=str(exc),
            ) from exc

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to process the uploaded document.",
        ) from exc


async def list_documents_controller(
    user_id: uuid.UUID,
    session: AsyncSession,
) -> list[DocumentResponse]:
    documents = await get_user_documents(
        user_id=user_id,
        session=session,
    )

    return [DocumentResponse.model_validate(document) for document in documents]


async def delete_document_controller(
    document_id: uuid.UUID,
    user_id: uuid.UUID,
    session: AsyncSession,
) -> dict:
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

    if document.status == DocumentStatus.DELETING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Document deletion is already in progress.",
        )

    if document.status in (
        DocumentStatus.PENDING,
        DocumentStatus.PROCESSING,
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete a document while processing.",
        )

    # Mark as deleting before external cleanup.
    await update_document_record(
        document=document,
        session=session,
        status=DocumentStatus.DELETING,
    )

    try:
        # Remove indexed chunks from Pinecone.
        await delete_document_vectors(
            document_id=document.id,
            chunk_count=document.chunk_count,
        )

        # Remove the original file from Cloudinary.
        if document.cloudinary_public_id:
            await delete_document_from_cloudinary(document.cloudinary_public_id)

        # Remove PostgreSQL metadata last.
        await delete_document_record(
            document=document,
            session=session,
        )

        return {
            "message": "Document deleted successfully.",
        }

    except Exception:
        logger.exception(
            "Failed to delete document %s",
            document.id,
        )

        await session.rollback()

        # Keep DELETING status so cleanup can be retried.
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Document deletion failed. Please try again later.",
        )
