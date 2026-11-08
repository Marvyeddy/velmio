from pydantic import BaseModel, Field
import uuid


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=10000)
    thread_id: uuid.UUID | None = None


class ChatResponse(BaseModel):
    thread_id: uuid.UUID
    response: str
