from typing import Annotated
import uuid

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from server.controllers.documents import (
    delete_document_controller,
    list_documents_controller,
    upload_document_controller,
)
from server.dependencies.current_user import get_current_user
from server.external.database import get_session
from server.models.user import User
from server.schemas.documents import DocumentResponse

document_router = APIRouter()


@document_router.post("/upload")
async def upload_document(
    file: Annotated[UploadFile, File()],
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    return await upload_document_controller(
        file=file,
        user_id=user.id,
        session=session,
    )


@document_router.get(
    "",
    response_model=list[DocumentResponse],
)
async def list_documents(
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    return await list_documents_controller(
        user_id=user.id,
        session=session,
    )


@document_router.delete("/{document_id}")
async def delete_document(
    document_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    return await delete_document_controller(
        document_id=document_id,
        user_id=user.id,
        session=session,
    )
