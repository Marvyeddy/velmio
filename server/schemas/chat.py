from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
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
