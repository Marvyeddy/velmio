import uuid
from fastapi import BackgroundTasks
import pytest

from server.controllers.auth import signup_controller
from unittest.mock import AsyncMock, MagicMock, Mock, patch
from server.errors import UserAlreadyExists
from server.models.user import User
from server.schemas.users import UserCreate
from server.services.auth import AuthService

auth_service = AuthService()

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
@patch("server.controllers.auth.create_email_verification_token")
@patch("server.controllers.auth.send_email")
async def test_signup_controller_success(
    mock_send_email, mock_create_email_verification, session
):

    mock_create_email_verification.return_value = "mocked_jwt_token"

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

    # 2. Act: Call the controller
    response = await signup_controller(bg=mock_bg, user_data=user_data, session=session)

    assert response["message"] == "User Signed up successfully"

    args, kwargs = mock_bg.add_task.call_args

    assert args[0] == mock_send_email
    assert kwargs["subject"] == "Verify your velmio account"
    assert kwargs["recipients"] == ["newuser@email.com"]
    assert "token=mocked_jwt_token" in kwargs["template_context"]["verification_url"]
