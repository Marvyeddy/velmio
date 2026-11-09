from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator
import uuid


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=10000)
    thread_id: uuid.UUID | None = None


class ChatResponse(BaseModel):
    thread_id: uuid.UUID
    response: str


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    created_at: datetime
    updated_at: datetime


class ConversationMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ConversationDetailResponse(ConversationResponse):
    messages: list[ConversationMessage]


class ConversationUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=255)

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        title = value.strip()

        if not title:
            raise ValueError("Conversation title cannot be empty")

        return title
