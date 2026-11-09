from fastapi import HTTPException, UploadFile, status

from server.services.documents import (
    DocumentProcessingError,
    process_document,
)


async def upload_document_controller(file: UploadFile):
    try:
        chunks, document_count = await process_document(file)
    except DocumentProcessingError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc

    return {
        "filename": file.filename,
        "document_units": document_count,
        "total_chunks": len(chunks),
        "message": "Document processed successfully.",
    }
