from typing import Annotated
from fastapi import APIRouter, Depends

from server.dependencies.current_user import get_current_user
from server.models.user import User

user_router = APIRouter()


@user_router.get("/me")
async def user(current_user: Annotated[User, Depends(get_current_user)]):

    return current_user
