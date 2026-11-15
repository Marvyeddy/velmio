"""add deleting document status

Revision ID: 339c11edd32b
Revises: 8f3c20f35808
Create Date: 2026-11-15 23:53:56.564246
"""

from typing import Sequence, Union

from alembic import op

# Revision identifiers, used by Alembic.
revision: str = "339c11edd32b"
down_revision: Union[str, Sequence[str], None] = "8f3c20f35808"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add DELETING status to the PostgreSQL documentstatus enum."""

    op.execute("ALTER TYPE documentstatus ADD VALUE IF NOT EXISTS 'deleting'")


def downgrade() -> None:
    """
    PostgreSQL does not support directly removing enum values.

    Reversing this migration would require recreating the enum type.
    """
    pass
