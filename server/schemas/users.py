from typing import Annotated
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: Annotated[EmailStr, Field(description="The user's email address")]
    username: Annotated[str, Field(description="The user's username")]
    password: Annotated[str, Field(description="The user's non-hashed password")]
