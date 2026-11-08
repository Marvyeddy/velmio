from sqlalchemy.ext.asyncio import AsyncSession
from server.models.user import User
from server.services.conversation import conversation_service


async def list_conversations_controller(user: User, session: AsyncSession):
    return await conversation_service.get_user_conversations(
        user_id=user.id, session=session
    )
