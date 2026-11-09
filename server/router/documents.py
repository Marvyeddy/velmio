from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from server.controllers.documents import upload_document_controller
from server.dependencies.current_user import get_current_user
from server.external.database import get_session
from server.models.user import User

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
