from datetime import UTC, datetime
import uuid
from sqlmodel import SQLModel, Field
import sqlalchemy as sa


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
        sa_column_kwargs={"server_default": sa.text("gen_random_uuid()")},
    )

    email: str = Field(max_length=255, unique=True, nullable=False)
    username: str = Field(max_length=255, unique=True, nullable=False)
    password: str | None = Field(default=None, max_length=255, nullable=True)

    is_active: bool = Field(
        default=True, sa_column_kwargs={"server_default": sa.true()}
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column_kwargs={"server_default": sa.func.now()},
    )

    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column_kwargs={
            "server_default": sa.func.now(),
            "onupdate": sa.func.now(),
        },
    )

    def __repr__(self) -> str:
        return f"<User username={self.username!r} email={self.email!r} is_active={self.is_active}>"
