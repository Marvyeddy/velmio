from unittest.mock import AsyncMock, call, patch

import pytest

from server.controllers.auth import signout_controller


# ============================================================
# 1. SUCCESSFUL SIGNOUT - BOTH TOKENS
# ============================================================


@pytest.mark.asyncio
@patch(
    "server.controllers.auth.add_token_to_blocklist",
    new_callable=AsyncMock,
)
@patch("server.controllers.auth.get_remaining_expiry")
@patch("server.controllers.auth.decode_token")
async def test_signout_success(
    mock_decode,
    mock_expiry,
    mock_blocklist,
):
    session_token = "mock-session-token"
    refresh_token = "mock-refresh-token"

    mock_decode.side_effect = [
        {
            "type": "session",
            "jti": "session-jti",
        },
        {
            "type": "refresh",
            "jti": "refresh-jti",
        },
    ]

    mock_expiry.side_effect = [1800, 172800]
    mock_blocklist.return_value = True

    response = await signout_controller(
        session_token,
        refresh_token,
    )

    assert response.status_code == 200

    assert response.body == (b'{"message":"Logged out successfully"}')

    # Verify both tokens were decoded
    assert mock_decode.call_count == 2

    mock_decode.assert_has_calls(
        [
            call(session_token),
            call(refresh_token),
        ]
    )

    # Verify both JTIs were revoked
    assert mock_blocklist.await_count == 2

    mock_blocklist.assert_has_awaits(
        [
            call("session-jti", 1800),
            call("refresh-jti", 172800),
        ]
    )

    # Verify cookies were deleted
    cookies = response.headers.getlist("set-cookie")

    assert any(
        "session-token=" in cookie and "Max-Age=0" in cookie for cookie in cookies
    )

    assert any(
        "refresh-token=" in cookie and "Max-Age=0" in cookie for cookie in cookies
    )


# ============================================================
# 2. SIGNOUT WITHOUT TOKENS
# ============================================================


@pytest.mark.asyncio
@patch(
    "server.controllers.auth.add_token_to_blocklist",
    new_callable=AsyncMock,
)
@patch("server.controllers.auth.decode_token")
async def test_signout_without_tokens(
    mock_decode,
    mock_blocklist,
):
    response = await signout_controller(None, None)

    assert response.status_code == 200

    mock_decode.assert_not_called()
    mock_blocklist.assert_not_awaited()

    cookies = response.headers.getlist("set-cookie")

    assert len(cookies) == 2


# ============================================================
# 3. INVALID TOKENS
# ============================================================


@pytest.mark.asyncio
@patch(
    "server.controllers.auth.add_token_to_blocklist",
    new_callable=AsyncMock,
)
@patch("server.controllers.auth.decode_token")
async def test_signout_invalid_tokens(
    mock_decode,
    mock_blocklist,
):
    mock_decode.return_value = None

    response = await signout_controller(
        "invalid-session-token",
        "invalid-refresh-token",
    )

    assert response.status_code == 200

    assert mock_decode.call_count == 2

    mock_blocklist.assert_not_awaited()


# ============================================================
# 4. WRONG TOKEN TYPES
# ============================================================


@pytest.mark.asyncio
@patch(
    "server.controllers.auth.add_token_to_blocklist",
    new_callable=AsyncMock,
)
@patch("server.controllers.auth.decode_token")
async def test_signout_wrong_token_types(
    mock_decode,
    mock_blocklist,
):
    mock_decode.side_effect = [
        {
            "type": "refresh",
            "jti": "wrong-session-jti",
        },
        {
            "type": "session",
            "jti": "wrong-refresh-jti",
        },
    ]

    response = await signout_controller(
        "session-token",
        "refresh-token",
    )

    assert response.status_code == 200

    mock_blocklist.assert_not_awaited()


# ============================================================
# 5. MISSING JTI
# ============================================================


@pytest.mark.asyncio
@patch(
    "server.controllers.auth.add_token_to_blocklist",
    new_callable=AsyncMock,
)
@patch("server.controllers.auth.decode_token")
async def test_signout_missing_jti(
    mock_decode,
    mock_blocklist,
):
    mock_decode.return_value = {
        "type": "session",
    }

    response = await signout_controller(
        "session-token",
        None,
    )

    assert response.status_code == 200

    mock_blocklist.assert_not_awaited()


# ============================================================
# 6. EXPIRED TOKEN
# ============================================================


@pytest.mark.asyncio
@patch(
    "server.controllers.auth.add_token_to_blocklist",
    new_callable=AsyncMock,
)
@patch("server.controllers.auth.get_remaining_expiry")
@patch("server.controllers.auth.decode_token")
async def test_signout_expired_token(
    mock_decode,
    mock_expiry,
    mock_blocklist,
):
    mock_decode.return_value = {
        "type": "session",
        "jti": "expired-jti",
    }

    mock_expiry.return_value = 0

    response = await signout_controller(
        "expired-session-token",
        None,
    )

    assert response.status_code == 200

    mock_blocklist.assert_not_awaited()


# ============================================================
# 7. ONLY SESSION TOKEN PROVIDED
# ============================================================


@pytest.mark.asyncio
@patch(
    "server.controllers.auth.add_token_to_blocklist",
    new_callable=AsyncMock,
)
@patch("server.controllers.auth.get_remaining_expiry")
@patch("server.controllers.auth.decode_token")
async def test_signout_session_only(
    mock_decode,
    mock_expiry,
    mock_blocklist,
):
    mock_decode.return_value = {
        "type": "session",
        "jti": "session-jti",
    }

    mock_expiry.return_value = 1800

    response = await signout_controller(
        "session-token",
        None,
    )

    assert response.status_code == 200

    mock_blocklist.assert_awaited_once_with(
        "session-jti",
        1800,
    )


# ============================================================
# 8. ONLY REFRESH TOKEN PROVIDED
# ============================================================


@pytest.mark.asyncio
@patch(
    "server.controllers.auth.add_token_to_blocklist",
    new_callable=AsyncMock,
)
@patch("server.controllers.auth.get_remaining_expiry")
@patch("server.controllers.auth.decode_token")
async def test_signout_refresh_only(
    mock_decode,
    mock_expiry,
    mock_blocklist,
):
    mock_decode.return_value = {
        "type": "refresh",
        "jti": "refresh-jti",
    }

    mock_expiry.return_value = 172800

    response = await signout_controller(
        None,
        "refresh-token",
    )

    assert response.status_code == 200

    mock_blocklist.assert_awaited_once_with(
        "refresh-jti",
        172800,
    )
