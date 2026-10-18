import uuid
import pytest
from sqlalchemy import select

from backend.model.auth import Auth
from backend.schema.auth_schema import UserRegister
from backend.service.auth_service import AuthService

auth_service = AuthService()


@pytest.mark.asyncio
async def test_get_user_by_id(session):
    user_id = uuid.uuid4()
    database_user = Auth(
        id=user_id,
        email="newuser@email.com",
        password="hashed_password",
        username="newuser",
    )

    session.add(database_user)
    await session.commit()

    user = await auth_service.get_user_by_id(database_user.id, session)

    assert user is not None
    assert isinstance(user, Auth)
    assert user.id == user_id
    assert user.email == "newuser@email.com"
    assert user.username == "newuser"
    assert user.password == "hashed_password"


@pytest.mark.asyncio
async def test_get_user_by_email(session):
    user_id = uuid.uuid4()
    database_user = Auth(
        id=user_id,
        email="newuser@email.com",
        password="hashed_password",
        username="newuser",
    )

    session.add(database_user)
    await session.commit()

    user = await auth_service.get_user_by_email(database_user.email, session)

    assert user is not None
    assert isinstance(user, Auth)
    assert user.id == user_id
    assert user.email == "newuser@email.com"
    assert user.username == "newuser"
    assert user.password == "hashed_password"


@pytest.mark.asyncio
async def test_get_user_by_username(session):
    user_id = uuid.uuid4()
    database_user = Auth(
        id=user_id,
        email="newuser@email.com",
        password="hashed_password",
        username="newuser",
    )

    session.add(database_user)
    await session.commit()

    user = await auth_service.get_user_by_username(database_user.username, session)

    assert user is not None
    assert isinstance(user, Auth)
    assert user.id == user_id
    assert user.email == "newuser@email.com"
    assert user.username == "newuser"
    assert user.password == "hashed_password"


@pytest.mark.asyncio
async def test_create_user(session):
    user = UserRegister(
        email="newuser@email.com", password="non-hashed-password", username="newuser"
    )

    response = await auth_service.create_user(user, session)

    assert response.email == "newuser@email.com"
    assert response.password != "non-hashed-password"
    assert response.username == "newuser"


@pytest.mark.asyncio
async def test_update_user(session):
    existing_user = Auth(
        id=uuid.uuid4(),
        email="testuser@email.com",
        username="testuser",
        password="hashed_password",
    )

    session.add(existing_user)
    await session.commit()

    response = await auth_service.update_user(
        existing_user.id, {"username": "testuser1"}, session
    )

    assert response.username != "testuser"
    assert response.username == "testuser1"
