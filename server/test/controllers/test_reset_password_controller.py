import uuid
import pytest
from unittest.mock import AsyncMock, patch

from server.controllers.auth import reset_password_controller
from server.errors import InvalidToken, UserNotFound
from server.models.user import User


@pytest.mark.asyncio
@patch("server.controllers.auth.verify_email_verification_token")
async def test_reset_password_controller_wrong_id(mock_verify_token, session):

    mock_verify_token.return_value = None

    with pytest.raises(InvalidToken):
        await reset_password_controller("any-password", "wrong-token", session)


@pytest.mark.asyncio
@patch("server.controllers.auth.verify_email_verification_token")
async def test_reset_password_controller_user_not_found(mock_verify_token, session):

    mock_verify_token.return_value = str(uuid.uuid4())

    user_id = uuid.uuid4()
    existing_user = User(
        id=user_id,
        email="newuser@email.com",
        username="newuser",
        password="hashed-password",
    )

    session.add(existing_user)
    await session.commit()

    with pytest.raises(UserNotFound):
        await reset_password_controller("any-password", "mock-user-id", session)


@pytest.mark.asyncio
@patch(
    "server.controllers.auth.consume_reset_token",
    new_callable=AsyncMock,
)
@patch(
    "server.controllers.auth.verify_email_verification_token",
)
@patch(
    "server.controllers.auth.auth_service.update_user",
    new_callable=AsyncMock,
)
async def test_reset_password_controller_success(
    mock_update_user,
    mock_verify_token,
    mock_consume_token,
    session,
):
    user_id = uuid.uuid4()

    mock_verify_token.return_value = str(user_id)
    mock_consume_token.return_value = True

    existing_user = User(
        id=user_id,
        email="newuser@email.com",
        username="newuser",
        password="hashed-password",
    )

    session.add(existing_user)
    await session.commit()

    response = await reset_password_controller(
        "new-password",
        "mock-reset-token",
        session,
    )

    # Verify token was validated
    mock_verify_token.assert_called_once_with("mock-reset-token")

    # Verify Redis token was consumed
    mock_consume_token.assert_awaited_once_with("mock-reset-token")

    # Verify password update
    mock_update_user.assert_awaited_once_with(
        user=existing_user,
        user_data={"password": "new-password"},
        session=session,
    )

    assert response == {"message": "Password reset successfully"}


@pytest.mark.asyncio
@patch(
    "server.controllers.auth.consume_reset_token",
    new_callable=AsyncMock,
)
@patch(
    "server.controllers.auth.verify_email_verification_token",
)
@patch(
    "server.controllers.auth.auth_service.update_user",
    new_callable=AsyncMock,
)
async def test_reset_password_token_already_used(
    mock_update_user,
    mock_verify_token,
    mock_consume_token,
    session,
):
    user_id = uuid.uuid4()

    existing_user = User(
        id=user_id,
        email="newuser@email.com",
        username="newuser",
        password="hashed-password",
    )

    session.add(existing_user)
    await session.commit()

    mock_verify_token.return_value = str(user_id)

    # Redis reports token already consumed or expired
    mock_consume_token.return_value = False

    with pytest.raises(InvalidToken):
        await reset_password_controller(
            "new-password",
            "already-used-token",
            session,
        )

    mock_consume_token.assert_awaited_once_with("already-used-token")

    # Password must not be updated
    mock_update_user.assert_not_awaited()
