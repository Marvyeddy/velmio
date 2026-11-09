from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile

from server.controllers.documents import upload_document_controller
from server.models.user import User

from server.dependencies.current_user import get_current_user


document_router = APIRouter()


@document_router.post("/upload")
async def upload_document(
    file: Annotated[UploadFile, File()],
    user: Annotated[User, Depends(get_current_user)],
):
    return await upload_document_controller(file)
