from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio.session import AsyncSession
from backend.core.security import hash_password
from backend.model.auth import Auth
from backend.schema.auth_schema import UserRegister


class AuthService:
    async def get_user_by_email(self, email: str, session: AsyncSession) -> Auth | None:
        statement = select(Auth).where(Auth.email == email)

        result = await session.execute(statement)

        return result.unique().scalar_one_or_none()

    async def get_user_by_username(
        self, username: str, session: AsyncSession
    ) -> Auth | None:
        statement = select(Auth).where(Auth.username == username)

        result = await session.execute(statement)

        return result.unique().scalar_one_or_none()

    async def get_user_by_id(self, id: UUID, session: AsyncSession) -> Auth | None:
        statement = select(Auth).where(Auth.id == id)

        result = await session.execute(statement)

        return result.unique().scalar_one_or_none()

    async def create_user(self, user_data: UserRegister, session: AsyncSession) -> Auth:
        user_dict = user_data.model_dump()
        user_dict["password"] = hash_password(user_data.password)
        new_user = Auth(**user_dict)

        session.add(new_user)
        await session.commit()

        return new_user

    async def update_user(
        self, id: UUID, data: dict, session: AsyncSession
    ) -> Auth | None:
        user = await self.get_user_by_id(id, session)

        if user is None:
            return None

        for key, value in data.items():
            if hasattr(user, key):
                if key == "password":
                    setattr(user, key, hash_password(value))
                else:
                    setattr(user, key, value)

        # Commit the changes to the database
        await session.commit()
        await session.refresh(user)

        return user
