from datetime import UTC, datetime
from enum import StrEnum
import uuid
from sqlmodel import Column, Field, Relationship, SQLModel
import sqlalchemy as sa
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from server.models.user import User


class DocumentStatus(StrEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    DELETING = "deleting"


class Document(SQLModel, table=True):
    __tablename__ = "documents"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        nullable=False,
        primary_key=True,
        sa_column_kwargs={"server_default": sa.text("gen_random_uuid()")},
    )
    user_id: uuid.UUID = Field(
        foreign_key="users.id", nullable=False, ondelete="CASCADE", index=True
    )
    filename: str = Field(nullable=False, max_length=255)
    file_type: str = Field(nullable=False, max_length=10)
    cloudinary_public_id: str | None = Field(
        default=None,
        max_length=500,
    )
    file_size: int | None = Field(
        default=None,
        ge=0,
    )
    status: DocumentStatus = Field(
        default=DocumentStatus.PENDING,
        sa_column=Column(
            sa.Enum(
                DocumentStatus,
                name="documentstatus",
                values_callable=lambda enum_class: [
                    member.value for member in enum_class
                ],
            ),
            nullable=False,
            server_default=DocumentStatus.PENDING.value,
        ),
    )
    chunk_count: int = Field(default=0, ge=0)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        nullable=False,
        sa_column_kwargs={"server_default": sa.func.now()},
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        nullable=False,
        sa_column_kwargs={"server_default": sa.func.now(), "onupdate": sa.func.now()},
    )

    user: "User" = Relationship(back_populates="documents")

    def __repr__(self) -> str:
        return (
            f"<Document id={self.id} "
            f"filename={self.filename!r} "
            f"status={self.status.value!r}>"
        )
