import json
import uuid
from fastapi import BackgroundTasks
import pytest

from server.controllers.auth import auth_service, signup_controller
from unittest.mock import AsyncMock, MagicMock, Mock, patch
from server.errors import UserAlreadyExists
from server.models.user import User
from server.schemas.users import UserCreate


# ===============================================================
# SIGNUP CONTROLLER
# ===============================================================


@pytest.mark.asyncio
async def test_signup_controller_email_exists(session):

    user_id = uuid.uuid4()
    existing_user = User(
        id=user_id,
        email="velmiouser@email.com",
        username="velmiouser",
        password="hashed-password",
    )

    session.add(existing_user)
    await session.commit()

    mock_bg = Mock(spec=BackgroundTasks)
    user_data = UserCreate(
        email="velmiouser@email.com",
        username="unique-username",
        password="non-hashed-password",
    )

    with pytest.raises(UserAlreadyExists):
        await signup_controller(mock_bg, user_data, session)


@pytest.mark.asyncio
async def test_signup_controller_username_exists(session):

    user_id = uuid.uuid4()
    existing_user = User(
        id=user_id,
        email="velmiouser@email.com",
        username="velmiouser",
        password="hashed-password",
    )

    session.add(existing_user)
    await session.commit()

    mock_bg = Mock(spec=BackgroundTasks)
    user_data = UserCreate(
        email="testemail@email.com",
        username="velmiouser",
        password="non-hashed-password",
    )

    with pytest.raises(UserAlreadyExists):
        await signup_controller(mock_bg, user_data, session)


@pytest.mark.asyncio
@patch("server.controllers.auth.create_refresh")
@patch("server.controllers.auth.create_session")
@patch("server.controllers.auth.create_email_verification_token")
@patch("server.controllers.auth.send_email")
async def test_signup_controller_success(
    mock_send_email,
    mock_create_email_verification,
    mock_create_session,
    mock_create_refresh,
    session,
):
    mock_create_email_verification.return_value = "mocked_jwt_token"
    mock_create_session.return_value = "mocked_session_token"
    mock_create_refresh.return_value = "mocked_refresh_token"

    auth_service.get_user_by_username = AsyncMock(return_value=None)
    auth_service.get_user_by_email = AsyncMock(return_value=None)

    mock_new_user = MagicMock()
    mock_new_user.id = "user_uuid_1234"
    mock_new_user.email = "newuser@email.com"
    mock_new_user.username = "newuser"

    auth_service.create_user = AsyncMock(return_value=mock_new_user)

    mock_bg = MagicMock(spec=BackgroundTasks)

    user_data = UserCreate(
        email="newuser@email.com",
        username="newuser",
        password="secure-password",
    )

    response = await signup_controller(
        bg=mock_bg,
        user_data=user_data,
        session=session,
    )

    response_data = json.loads(response.body.decode("utf-8"))

    # Assert response
    assert response.status_code == 200
    assert response_data["message"] == "User Signed up successfully"

    # Assert service calls
    auth_service.get_user_by_username.assert_awaited_once_with("newuser", session)

    auth_service.get_user_by_email.assert_awaited_once_with(
        "newuser@email.com", session
    )

    auth_service.create_user.assert_awaited_once()

    # Assert background email task
    mock_bg.add_task.assert_called_once()

    args, kwargs = mock_bg.add_task.call_args

    assert args[0] == mock_send_email
    assert kwargs["subject"] == "Verify your velmio account"
    assert kwargs["recipients"] == ["newuser@email.com"]
    assert kwargs["template_name"] == "verify_email.html"
    assert kwargs["template_context"]["username"] == "newuser"
    assert kwargs["template_context"]["expiry_minutes"] == 30
    assert "token=mocked_jwt_token" in kwargs["template_context"]["verification_url"]

    mock_create_email_verification.assert_called_once_with("user_uuid_1234")

    # Assert token generation
    mock_create_session.assert_called_once()
    mock_create_refresh.assert_called_once()

    # Assert cookies
    cookies = response.headers.getlist("set-cookie")

    session_cookie = next(
        cookie for cookie in cookies if cookie.startswith("session-token=")
    )
    refresh_cookie = next(
        cookie for cookie in cookies if cookie.startswith("refresh-token=")
    )

    assert "mocked_session_token" in session_cookie
    assert "mocked_refresh_token" in refresh_cookie

    assert "HttpOnly" in session_cookie
    assert "HttpOnly" in refresh_cookie
    assert "Secure" in session_cookie
    assert "Secure" in refresh_cookie
