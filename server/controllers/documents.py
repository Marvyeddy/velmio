import uuid

from fastapi import HTTPException, UploadFile, status
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
    # 1. Validate before creating any database record.
    try:
        file_bytes, filename, extension = await validate_document(file)
    except DocumentProcessingError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc
    finally:
        await file.close()

    # 2. Create the document record.
    document = await create_document_record(
        user_id=user_id,
        filename=filename,
        file_type=extension.lstrip("."),
        file_size=len(file_bytes),
        session=session,
    )

    cloudinary_public_id = None

    try:
        # 3. Upload the original file to Cloudinary.
        result = await upload_document_to_cloudinary(
            file_bytes=file_bytes,
            document_id=str(document.id),
        )

        cloudinary_public_id = result["public_id"]

        # 4. Mark the document as processing.
        await update_document_record(
            document=document,
            session=session,
            status=DocumentStatus.PROCESSING,
            cloudinary_public_id=cloudinary_public_id,
        )

        # 5. Extract and split the document.
        chunks, document_units = await process_document_bytes(
            file_bytes=file_bytes,
            filename=filename,
            extension=extension,
        )

        # 6. Record the extracted chunk count.
        # Do not mark COMPLETED until Pinecone indexing succeeds.
        await update_document_record(
            document=document,
            session=session,
            status=DocumentStatus.PROCESSING,
            chunk_count=len(chunks),
        )

        logger.info(
            "Document %s processed into %s chunks",
            document.id,
            len(chunks),
        )

        return {
            "document_id": str(document.id),
            "filename": filename,
            "file_type": extension.lstrip("."),
            "document_units": document_units,
            "chunk_count": len(chunks),
            "status": DocumentStatus.PROCESSING.value,
            "message": (
                "Document uploaded and text extracted. Vector indexing is pending."
            ),
        }

    except Exception:
        logger.exception(
            "Document processing failed: %s",
            document.id,
        )

        await session.rollback()

        try:
            await update_document_record(
                document=document,
                session=session,
                status=DocumentStatus.FAILED,
            )
        except Exception:
            logger.exception(
                "Unable to mark document %s as failed",
                document.id,
            )

        if cloudinary_public_id:
            try:
                await delete_document_from_cloudinary(cloudinary_public_id)
            except Exception:
                logger.exception(
                    "Cloudinary cleanup failed for %s",
                    document.id,
                )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to process the uploaded document.",
        )
