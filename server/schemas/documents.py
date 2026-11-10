from datetime import datetime
import uuid
from pydantic import BaseModel, ConfigDict

from server.models.document import DocumentStatus


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    filename: str
    file_type: str
    file_size: int
    status: DocumentStatus
    chunk_count: int
    created_at: datetime
