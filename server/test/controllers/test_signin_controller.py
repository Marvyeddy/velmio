import json
import uuid
import pytest

from server.controllers.auth import auth_service, signin_controller
from server.errors import InvalidCredentials
from server.models.user import User
from server.schemas.users import UserLogin
from unittest.mock import AsyncMock, patch


@pytest.mark.asyncio
@patch("server.controllers.auth.auth_service.get_user_by_email")
@patch("server.controllers.auth.verify_pwd")
async def test_signin_controller_wrong_email(
    mock_verify_pwd,
    mock_get_user,
    session,
):
    # Simulate an email that doesn't exist
    mock_get_user.return_value = None

    user_data = UserLogin(
        email="wrongemail@email.com",
        password="any-password",
    )

    with pytest.raises(InvalidCredentials):
        await signin_controller(user_data, session)

    mock_get_user.assert_awaited_once_with(
        "wrongemail@email.com",
        session,
    )

    # Password verification must not run for nonexistent users
    mock_verify_pwd.assert_not_called()


@pytest.mark.asyncio
@patch("server.controllers.auth.verify_pwd")
async def test_signin_controller_wrong_password(mock_verify_pwd, session):

    mock_verify_pwd.return_value = False

    user_id = uuid.uuid4()
    existing_data = User(
        id=user_id,
        email="newuser@email.com",
        password="hashed-password",
        username="newuser",
    )
    session.add(existing_data)
    await session.commit()

    # CHANGE THIS: Use an email that does NOT exist in the database
    user_data = UserLogin(email="wrongemail@email.com", password="any-password")

    with pytest.raises(InvalidCredentials):
        await signin_controller(user_data, session)


@pytest.mark.asyncio
@patch("server.controllers.auth.create_refresh")
@patch("server.controllers.auth.create_session")
@patch("server.controllers.auth.verify_pwd")
async def test_signin_controller_success(
    mock_verify_pwd, mock_create_session, mock_create_refresh, session
):

    mock_verify_pwd.return_value = True
    mock_create_session.return_value = "mocked-session-token"
    mock_create_refresh.return_value = "mocked-refresh-token"

    user_id = uuid.uuid4()
    existing_data = User(
        id=user_id,
        email="newuser@email.com",
        password="hashed-password",
        username="newuser",
    )
    session.add(existing_data)
    await session.commit()

    user_data = UserLogin(email="newuser@email.com", password="any-password")

    response = await signin_controller(user_data, session)

    assert response.status_code == 200

    response_data = json.loads(response.body.decode("utf-8"))

    assert response_data["message"] == "User logged-in successfully"

    headers = response.headers.getlist("set-cookie")

    assert any("session-token=mocked-session-token" in cookie for cookie in headers)
    assert any("refresh-token=mocked-refresh-token" in cookie for cookie in headers)
