import uuid
from fastapi import BackgroundTasks
import pytest
from unittest.mock import MagicMock, patch

from backend.error import InvalidUserCredential, UserAlreadyExists
from backend.model.auth import Auth
from backend.route.auth_route import create_user, login_user
from backend.schema.auth_schema import UserLogin, UserRegister


@pytest.mark.asyncio
@patch("backend.route.auth_route.send_email")
async def test_create_user(mock_send_email, client):
    payload = {
        "email": "newuser@email.com",
        "password": "non-hashed password",
        "username": "newuser",
    }

    response = await client.post("/api/v1/auth/signup", json=payload)

    assert response.status_code == 201

    data = response.json()

    assert data["message"] == "User registered successfully"
    assert "session_token" in data
    assert "refresh_token" in data

    assert "session_token" in response.cookies
    assert "refresh_token" in response.cookies
    assert response.cookies["session_token"] == data["session_token"]
    assert response.cookies["refresh_token"] == data["refresh_token"]

    mock_send_email.assert_called_once()


@pytest.mark.asyncio
@patch("backend.route.auth_route.verify_password")
async def test_login_user(mock_verify, client, session):
    mock_verify.return_value = True

    user_in_db = Auth(
        id=uuid.uuid4(),
        email="newuser@email.com",
        password="hashed-password",
        username="newuser",
    )

    session.add(user_in_db)
    await session.commit()

    payload = {"email": "newuser@email.com", "password": "non-hashed-password"}

    response = await client.post("/api/v1/auth/signin", json=payload)

    assert response.status_code == 200

    data = response.json()

    assert data["message"] == "Login successful"
    assert "session_token" in data
    assert "refresh_token" in data

    assert "session_token" in response.cookies
    assert "refresh_token" in response.cookies
    assert response.cookies["session_token"] == data["session_token"]
    assert response.cookies["refresh_token"] == data["refresh_token"]


@pytest.mark.asyncio
@patch("backend.route.auth_route.send_email")
async def test_username_and_email_already_exists_direct(mock_send_email, session):
    # 1. Setup mock/existing data in the database
    existing_user = Auth(
        id=uuid.uuid4(),
        email="testuser@email.com",
        password="hashed-password",
        username="testuser",
    )
    session.add(existing_user)
    await session.commit()

    # 2. Build your Pydantic data contract directly
    payload = UserRegister(
        email="testuser@email.com",
        password="non-hashed-password",
        username="testuser",
    )

    mock_bg = MagicMock(spec=BackgroundTasks)

    # 3. Assert that calling the route directly raises the specific error class
    with pytest.raises(UserAlreadyExists):
        await create_user(bg=mock_bg, user_data=payload, session=session)

    mock_send_email.assert_not_called()


@pytest.mark.asyncio
@patch("backend.route.auth_route.verify_password")
async def test_invalid_credentials(mock_verify, session):
    mock_verify.return_value = False
    existing_user = Auth(
        id=uuid.uuid4(),
        email="testuser@email.com",
        password="hashed-password",
        username="testuser",
    )
    session.add(existing_user)
    await session.commit()

    payload = UserLogin(email="newuser@email.com", password="non-hashed-password")

    with pytest.raises(InvalidUserCredential):
        await login_user(user_data=payload, session=session)
