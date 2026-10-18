from typing import Optional
from pydantic import BaseModel, EmailStr, Field, model_validator


class UserRegister(BaseModel):
    email: EmailStr = Field(description="email of the user")
    password: str = Field(
        ..., min_length=8, description="Un-hashed pasword of the user"
    )
    username: str = Field(description="Username of the user")


class UserLogin(BaseModel):
    email: Optional[EmailStr] = Field(default=None, description="User email address")
    username: Optional[str] = Field(default=None, description="Username of the user")
    password: str = Field(..., min_length=8, description="Users un-hashed password")

    @model_validator(mode="after")
    def check_either_but_not_both(self) -> "UserLogin":
        if not self.email and not self.username:
            raise ValueError("Either email or username must be provided.")

        if self.email and self.username:
            raise ValueError("Provide either email or username, but not both.")

        return self


class ResetPasswordSubmitSchema(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, description="The new secure password")
