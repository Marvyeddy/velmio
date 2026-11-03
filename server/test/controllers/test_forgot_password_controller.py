from unittest.mock import AsyncMock, MagicMock, patch
import uuid
from fastapi import BackgroundTasks
import pytest

from server.controllers.auth import auth_service, forgot_password_controller
from server.errors import UserNotFound
from server.models.user import User


@pytest.mark.asyncio
async def test_forgot_password_user_not_found(session):

    mock_bg = MagicMock(spec=BackgroundTasks)
    with patch(
        "server.controllers.auth.auth_service.get_user_by_email",
        new_callable=AsyncMock,
    ) as mock_get_user:
        mock_get_user.return_value = None

    with pytest.raises(UserNotFound):
        await forgot_password_controller(mock_bg, "newuser@email.com", session)

    mock_bg.add_task.assert_not_called()


@pytest.mark.asyncio
@patch(
    "server.controllers.auth.store_reset_token",
    new_callable=AsyncMock,
)
@patch("server.controllers.auth.create_email_verification_token")
async def test_forgot_password_success(
    mock_token,
    mock_store_token,
    session,
):
    user_id = uuid.uuid4()

    existing_user = User(
        id=user_id,
        email="newuser@email.com",
        password="hashed-password",
        username="newuser",
    )

    session.add(existing_user)
    await session.commit()

    mock_token.return_value = "mocked-reset-token"

    mock_bg = MagicMock(spec=BackgroundTasks)

    response = await forgot_password_controller(
        mock_bg,
        existing_user.email,
        session,
    )

    # Verify token generation
    mock_token.assert_called_once_with(str(user_id))

    # Verify token was stored in Redis
    mock_store_token.assert_awaited_once_with("mocked-reset-token")

    # Verify background email was scheduled
    mock_bg.add_task.assert_called_once()

    assert response == {"message": "Reset link has been sent to your email"}
