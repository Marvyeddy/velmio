import uuid
import pytest

from server.models.user import User
from server.services.auth import AuthService

auth_service = AuthService()


@pytest.mark.asyncio
async def test_get_user_by_email(session):

    user_id = uuid.uuid4()
    existing_user = User(
        id=user_id,
        email="velmiouser@email.com",
        password="hashed_password",
        username="velmiouser",
    )

    session.add(existing_user)
    await session.commit()

    response = await auth_service.get_user_by_email("velmiouser@email.com", session)

    assert response.email == "velmiouser@email.com"


@pytest.mark.asyncio
async def test_get_user_by_username(session):

    user_id = uuid.uuid4()
    existing_user = User(
        id=user_id,
        email="velmiouser@email.com",
        password="hashed_password",
        username="velmiouser",
    )

    session.add(existing_user)
    await session.commit()

    response = await auth_service.get_user_by_username("velmiouser", session)

    assert response.email == "velmiouser@email.com"
    assert response.username == "velmiouser"


@pytest.mark.asyncio
async def test_create_user(session):
    new_user = {
        "email": "velmiouser@email.com",
        "username": "velmiouser",
        "password": "non-hashed-password",
    }

    response = await auth_service.create_user(new_user, session)

    assert response.email == "velmiouser@email.com"
