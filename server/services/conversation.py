from datetime import UTC, datetime
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from server.models.conversation import Conversation
from typing import List


class ConversationService:
    async def create_conversation(
        self, user_id: uuid.UUID, session: AsyncSession
    ) -> Conversation:

        conversation = Conversation(user_id=user_id)

        session.add(conversation)
        await session.commit()
        await session.refresh(conversation)

        return conversation

    async def get_conversation(
        self, conversation_id: uuid.UUID, user_id: uuid.UUID, session: AsyncSession
    ) -> Conversation | None:

        statement = select(Conversation).where(
            Conversation.id == conversation_id, Conversation.user_id == user_id
        )

        result = await session.execute(statement)

        return result.scalar_one_or_none()

    async def update_conversation(
        self,
        conversation: Conversation,
        session: AsyncSession,
        title: str | None = None,
    ) -> Conversation:

        if title is not None:
            conversation.title = title

        conversation.updated_at = datetime.now(UTC)

        session.add(conversation)
        await session.commit()
        await session.refreeh()

    async def get_user_conversations(
        self,
        user_id: uuid.UUID,
        session: AsyncSession,
    ) -> List[Conversation]:

        statements = (
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .order_by(Conversation.updated_at.desc())
        )

        result = await session.execute(statements)

        return list(result.scalars().all())

    async def delete_conversation(
        self,
        conversation: Conversation,
        session: AsyncSession,
    ) -> None:
        await session.delete(conversation)
        await session.commit()


conversation_service = ConversationService()
