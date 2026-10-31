from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from server.models.user import User
from server.schemas.users import UserCreate
from server.utils.hashing import hash_pwd


class AuthService:
    async def get_user_by_email(self, email: str, session: AsyncSession) -> User:

        statement = select(User).where(User.email == email)

        result = await session.execute(statement)

        return result.unique().scalar_one_or_none()

    async def get_user_by_username(self, username: str, session: AsyncSession) -> User:

        statement = select(User).where(User.username == username)

        result = await session.execute(statement)

        return result.unique().scalar_one_or_none()

    async def create_user(self, user_data: dict, session: AsyncSession):

        new_user = User(**user_data)
        new_user.password = hash_pwd(user_data["password"])

        session.add(new_user)
        await session.commit()
        await session.refresh(new_user)
        return new_user
