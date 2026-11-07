from datetime import UTC, datetime
from typing import TYPE_CHECKING
import uuid
from sqlmodel import Field, Relationship, SQLModel
import sqlalchemy as sa

if TYPE_CHECKING:
    from server.models.user import User


class Conversation(SQLModel, table=True):
    __tablename__ = "conversations"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False,
        sa_column_kwargs={"server_default": sa.text("gen_random_uuid()")},
    )
    user_id: uuid.UUID = Field(
        foreign_key="users.id", nullable=False, index=True, ondelete="CASCADE"
    )
    title: str = Field(default="New Chat", max_length=255, nullable=False)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        nullable=False,
        sa_column_kwargs={"server_default": sa.func.now()},
    )

    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        nullable=False,
        sa_column_kwargs={
            "server_default": sa.func.now(),
            "onupdate": sa.func.now(),
        },
    )
    user: "User" = Relationship(back_populates="conversations")

    def __repr__(self) -> str:
        return f"<Conversation id={self.id} title={self.title!r}>"
