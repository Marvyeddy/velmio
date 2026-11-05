import uuid
import pytest
from unittest.mock import AsyncMock, patch

from server.dependencies.current_user import get_current_user
from server.errors import EmailNotVerified, InvalidToken, UserNotFound
from server.models.user import User


@pytest.mark.asyncio
@patch("server.dependencies.current_user.decode_token")
async def test_get_user_deps_no_session(mock_decode, session):

    with pytest.raises(InvalidToken):
        await get_current_user("", session)

    mock_decode.assert_not_called()


@pytest.mark.asyncio
@patch("server.dependencies.current_user.decode_token")
async def test_get_user_deps_invalid_token(mock_decode, session):

    mock_decode.return_value = None

    with pytest.raises(InvalidToken):
        await get_current_user(session_token="invalid-token", session=session)

    mock_decode.assert_called_once()


@pytest.mark.asyncio
@patch("server.dependencies.current_user.decode_token")
async def test_get_user_deps_wrong_token_type(mock_decode, session):

    mock_decode.return_value = {
        "sub": str(uuid.uuid4()),
        "type": "refresh",
        "jti": "refresh-jti",
    }

    with pytest.raises(InvalidToken):
        await get_current_user(session_token="invalid-token", session=session)

    mock_decode.assert_called_once_with("invalid-token")


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "token_data",
    [
        {"type": "session", "jti": "valid-jti"},
        {"type": "session", "sub": "user-id"},
        {"type": "session", "sub": "user-id", "jti": ""},
        {"type": "session", "sub": "user-id", "jti": None},
        {"type": "session", "sub": "user-id", "jti": 123},
        {"type": "session", "sub": "", "jti": "valid-jti"},
    ],
)
@patch("server.dependencies.current_user.decode_token")
async def test_get_user_deps_missing_claims(
    mock_decode,
    token_data,
    session,
):

    mock_decode.return_value = token_data

    with pytest.raises(InvalidToken):
        await get_current_user(
            session_token="session-token",
            session=session,
        )


@pytest.mark.asyncio
@patch("server.dependencies.current_user.decode_token")
@patch("server.dependencies.current_user.token_in_blocklist", new_callable=AsyncMock)
async def test_get_user_deps_token_revoked(mock_token_blocklist, mock_decode, session):

    mock_token_blocklist.return_value = True
    mock_decode.return_value = {
        "sub": str(uuid.uuid4()),
        "jti": "session-jti",
        "type": "session",
    }

    with pytest.raises(InvalidToken):
        await get_current_user(session_token="session_token", session=session)

    mock_decode.assert_called_once_with("session_token")
    mock_token_blocklist.assert_awaited_once_with("session-jti")


@pytest.mark.asyncio
@patch(
    "server.dependencies.current_user.auth_service.get_user_by_id",
    new_callable=AsyncMock,
)
@patch("server.dependencies.current_user.decode_token")
@patch("server.dependencies.current_user.token_in_blocklist", new_callable=AsyncMock)
async def test_get_user_deps_no_user(
    mock_token_blocklist, mock_decode, mock_get_user, session
):

    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        email="newuser@email.com",
        username="newuser",
        password="hashed-password",
        verified=True,
        is_active=True,
    )

    session.add(user)
    await session.commit()

    mock_get_user.return_value = None
    mock_token_blocklist.return_value = False
    mock_decode.return_value = {
        "sub": "wrong_id",
        "jti": "session-jti",
        "type": "session",
    }

    with pytest.raises(UserNotFound):
        await get_current_user(
            session_token="right-session-with-wrong-id", session=session
        )

    mock_decode.assert_called_once()
    mock_token_blocklist.assert_awaited_once()
    mock_get_user.assert_awaited_once_with("wrong_id", session)


@pytest.mark.asyncio
@patch(
    "server.dependencies.current_user.auth_service.get_user_by_id",
    new_callable=AsyncMock,
)
@patch("server.dependencies.current_user.decode_token")
@patch("server.dependencies.current_user.token_in_blocklist", new_callable=AsyncMock)
async def test_get_user_deps_user_not_active(
    mock_token_blocklist, mock_decode, mock_get_user, session
):

    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        email="newuser@email.com",
        username="newuser",
        password="hashed-password",
        verified=True,
        is_active=False,
    )

    session.add(user)
    await session.commit()

    mock_get_user.return_value = user
    mock_token_blocklist.return_value = False
    mock_decode.return_value = {
        "sub": str(user_id),
        "jti": "session-jti",
        "type": "session",
    }

    with pytest.raises(InvalidToken):
        await get_current_user(session_token="right-session-token", session=session)

    mock_decode.assert_called_once()
    mock_token_blocklist.assert_awaited_once()
    mock_get_user.assert_awaited_once_with(str(user_id), session)


@pytest.mark.asyncio
@patch(
    "server.dependencies.current_user.auth_service.get_user_by_id",
    new_callable=AsyncMock,
)
@patch("server.dependencies.current_user.decode_token")
@patch("server.dependencies.current_user.token_in_blocklist", new_callable=AsyncMock)
async def test_get_user_deps_user_not_verified(
    mock_token_blocklist, mock_decode, mock_get_user, session
):

    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        email="newuser@email.com",
        username="newuser",
        password="hashed-password",
        verified=False,
        is_active=True,
    )

    session.add(user)
    await session.commit()

    mock_get_user.return_value = user
    mock_token_blocklist.return_value = False
    mock_decode.return_value = {
        "sub": str(user_id),
        "jti": "session-jti",
        "type": "session",
    }

    with pytest.raises(EmailNotVerified):
        await get_current_user(session_token="right-session-token", session=session)

    mock_decode.assert_called_once()
    mock_token_blocklist.assert_awaited_once()
    mock_get_user.assert_awaited_once_with(str(user_id), session)


@pytest.mark.asyncio
@patch(
    "server.dependencies.current_user.auth_service.get_user_by_id",
    new_callable=AsyncMock,
)
@patch("server.dependencies.current_user.decode_token")
@patch("server.dependencies.current_user.token_in_blocklist", new_callable=AsyncMock)
async def test_get_user_deps_success(
    mock_token_blocklist, mock_decode, mock_get_user, session
):

    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        email="newuser@email.com",
        username="newuser",
        password="hashed-password",
        verified=True,
        is_active=True,
    )

    session.add(user)
    await session.commit()

    mock_get_user.return_value = user
    mock_token_blocklist.return_value = False
    mock_decode.return_value = {
        "sub": str(user_id),
        "jti": "session-jti",
        "type": "session",
    }

    response = await get_current_user(session_token="right_token", session=session)

    assert response == user

    mock_decode.assert_called_once_with("right_token")
    mock_token_blocklist.assert_awaited_once()
    mock_get_user.assert_awaited_once_with(str(user_id), session)
