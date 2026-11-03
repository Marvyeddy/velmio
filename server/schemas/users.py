from typing import Annotated
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: Annotated[EmailStr, Field(description="The user's email address")]
    username: Annotated[str, Field(description="The user's username")]
    password: Annotated[str, Field(description="The user's non-hashed password")]


class UserLogin(BaseModel):
    email: Annotated[
        EmailStr, Field(description="The user's current email in database")
    ]
    password: Annotated[str, Field(description="The users non-hashed password in db")]


class EmailRequest(BaseModel):
    email: Annotated[EmailStr, Field(description="The user's email address")]


class PasswordRequest(BaseModel):
    password: Annotated[str, Field(description="The new proposed password")]
