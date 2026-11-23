from typing import Annotated
from fastapi import APIRouter, Depends

from server.dependencies.current_user import get_current_user
from server.models.user import User
from server.schemas.users import UserResponse

user_router = APIRouter()


@user_router.get("/me", response_model=UserResponse)
async def user(current_user: Annotated[User, Depends(get_current_user)]):

    return current_user
