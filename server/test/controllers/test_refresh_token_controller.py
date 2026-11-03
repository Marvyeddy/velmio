import uuid
from unittest.mock import patch

import pytest

from server.controllers.auth import refresh_token_controller
from server.errors import InvalidToken
from server.models.user import User


# ============================================================
# 1. SUCCESSFUL TOKEN REFRESH
# ============================================================


@pytest.mark.asyncio
@patch("server.controllers.auth.create_refresh")
@patch("server.controllers.auth.create_session")
@patch("server.controllers.auth.decode_token")
async def test_refresh_token_success(
    mock_decode,
    mock_create_session,
    mock_create_refresh,
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

    mock_decode.return_value = {
        "sub": str(user_id),
        "type": "refresh",
    }

    mock_create_session.return_value = "new-session-token"
    mock_create_refresh.return_value = "new-refresh-token"

    response = await refresh_token_controller(
        "valid-refresh-token",
        session,
    )

    assert response.status_code == 200

    assert response.body == (b'{"message":"Session and refresh tokens refreshed"}')

    mock_decode.assert_called_once_with("valid-refresh-token")

    token_dict = {
        "sub": str(user_id),
        "email": existing_user.email,
    }

    mock_create_session.assert_called_once_with(token_dict)
    mock_create_refresh.assert_called_once_with(token_dict)

    cookies = response.headers.getlist("set-cookie")

    assert any("session-token=new-session-token" in cookie for cookie in cookies)

    assert any("refresh-token=new-refresh-token" in cookie for cookie in cookies)


# ============================================================
# 2. MISSING REFRESH TOKEN
# ============================================================


@pytest.mark.asyncio
@patch("server.controllers.auth.decode_token")
async def test_refresh_token_missing(mock_decode, session):

    with pytest.raises(InvalidToken):
        await refresh_token_controller("", session)

    mock_decode.assert_not_called()


# ============================================================
# 3. INVALID OR EXPIRED REFRESH TOKEN
# ============================================================


@pytest.mark.asyncio
@patch("server.controllers.auth.decode_token")
async def test_refresh_token_invalid(mock_decode, session):

    mock_decode.return_value = None

    with pytest.raises(InvalidToken):
        await refresh_token_controller(
            "invalid-refresh-token",
            session,
        )

    mock_decode.assert_called_once_with("invalid-refresh-token")


# ============================================================
# 4. WRONG TOKEN TYPE
# ============================================================


@pytest.mark.asyncio
@patch("server.controllers.auth.decode_token")
async def test_refresh_token_wrong_type(mock_decode, session):

    mock_decode.return_value = {
        "sub": str(uuid.uuid4()),
        "type": "session",
    }

    with pytest.raises(InvalidToken):
        await refresh_token_controller(
            "session-token",
            session,
        )


# ============================================================
# 5. MISSING SUBJECT
# ============================================================


@pytest.mark.asyncio
@patch("server.controllers.auth.decode_token")
async def test_refresh_token_missing_subject(mock_decode, session):

    mock_decode.return_value = {
        "type": "refresh",
    }

    with pytest.raises(InvalidToken):
        await refresh_token_controller(
            "refresh-token-without-sub",
            session,
        )


# ============================================================
# 6. USER NOT FOUND
# ============================================================


@pytest.mark.asyncio
@patch("server.controllers.auth.auth_service.get_user_by_id")
@patch("server.controllers.auth.decode_token")
async def test_refresh_token_user_not_found(
    mock_decode,
    mock_get_user,
    session,
):
    user_id = str(uuid.uuid4())

    mock_decode.return_value = {
        "sub": user_id,
        "type": "refresh",
    }

    mock_get_user.return_value = None

    with pytest.raises(InvalidToken):
        await refresh_token_controller(
            "valid-refresh-token",
            session,
        )

    mock_get_user.assert_awaited_once_with(
        user_id,
        session,
    )


# ============================================================
# 7. INACTIVE USER
# ============================================================


@pytest.mark.asyncio
@patch("server.controllers.auth.auth_service.get_user_by_id")
@patch("server.controllers.auth.decode_token")
async def test_refresh_token_inactive_user(
    mock_decode,
    mock_get_user,
    session,
):
    user_id = uuid.uuid4()

    inactive_user = User(
        id=user_id,
        email="inactive@email.com",
        username="inactive",
        password="hashed-password",
        is_active=False,
    )

    mock_decode.return_value = {
        "sub": str(user_id),
        "type": "refresh",
    }

    mock_get_user.return_value = inactive_user

    with pytest.raises(InvalidToken):
        await refresh_token_controller(
            "valid-refresh-token",
            session,
        )

    mock_get_user.assert_awaited_once_with(
        str(user_id),
        session,
    )
