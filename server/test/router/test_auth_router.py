import pytest
from unittest.mock import AsyncMock, patch
from server.schemas.users import EmailRequest, PasswordRequest, UserCreate, UserLogin


@pytest.mark.asyncio
@patch("server.router.auth.signup_controller", new_callable=AsyncMock)
async def test_signup_router(mock_controller, client):

    user_data = UserCreate(
        email="newuser@email.com", username="newuser", password="non-hashed-password"
    )

    mock_controller.return_value = {"message": "User Signed up successfully"}

    response = await client.post("/api/v1/auth/signup", json=user_data.model_dump())

    assert response.status_code == 201
    assert response.json() == {"message": "User Signed up successfully"}

    mock_controller.assert_called_once()


@pytest.mark.asyncio
@patch("server.router.auth.signin_controller", new_callable=AsyncMock)
async def test_signin_router(mock_controller, client):

    user_data = UserLogin(email="newuser@email.com", password="any-password")

    mock_controller.return_value = {"message": "User logged-in successfully"}

    response = await client.post("/api/v1/auth/signin", json=user_data.model_dump())

    assert response.status_code == 200
    assert response.json() == {"message": "User logged-in successfully"}

    mock_controller.assert_called_once()


@pytest.mark.asyncio
@patch("server.router.auth.verify_email_controller", new_callable=AsyncMock)
async def test_verify_email_router(mock_controller, client):

    token = "mocked_jwt_token"

    mock_controller.return_value = {"message": "Email verified successfully"}

    response = await client.get(f"/api/v1/auth/verify-email?token={token}")

    assert response.status_code == 200
    assert response.json() == {"message": "Email verified successfully"}


@pytest.mark.asyncio
@patch(
    "server.router.auth.resend_email_verification_controller", new_callable=AsyncMock
)
async def test_resend_verification_email_router(mock_controller, client):
    email = "newuser@email.com"

    mock_controller.return_value = {"message": "Email verification resent successfully"}

    response = await client.post(
        "/api/v1/auth/resend-email-verification",
        json=EmailRequest(email=email).model_dump(),
    )

    assert response.status_code == 200
    assert response.json() == {"message": "Email verification resent successfully"}


@pytest.mark.asyncio
@patch("server.router.auth.forgot_password_controller", new_callable=AsyncMock)
async def test_forgot_password_router(mock_forgot_password, client):

    email = "newuser@email.com"

    mock_forgot_password.return_value = {
        "message": "Reset link has been sent to your email"
    }

    response = await client.post(
        "/api/v1/auth/forgot-password", json=EmailRequest(email=email).model_dump()
    )

    assert response.status_code == 200
    assert response.json() == {"message": "Reset link has been sent to your email"}


@pytest.mark.asyncio
@patch(
    "server.router.auth.reset_password_controller",
    new_callable=AsyncMock,
)
async def test_reset_password_router(mock_reset_password, client):

    password = "new-password"
    token = "mock-reset-token"

    mock_reset_password.return_value = {"message": "Password reset successfully"}

    response = await client.post(
        "/api/v1/auth/reset-password",
        params={"token": token},
        json=PasswordRequest(password=password).model_dump(),
    )

    assert response.status_code == 200

    assert response.json() == {"message": "Password reset successfully"}

    mock_reset_password.assert_awaited_once()

    args = mock_reset_password.await_args.args

    assert args[0] == password
    assert args[1] == token


@pytest.mark.asyncio
@patch(
    "server.router.auth.refresh_token_controller",
    new_callable=AsyncMock,
)
async def test_refresh_token_router(
    mock_refresh_token,
    client,
    session,
):
    refresh_token = "mock-refresh-token"

    mock_refresh_token.return_value = {
        "message": "Session and refresh tokens refreshed"
    }

    # Set cookie on the client
    client.cookies.set("refresh-token", refresh_token)

    response = await client.get("/api/v1/auth/refresh")

    assert response.status_code == 200

    assert response.json() == {"message": "Session and refresh tokens refreshed"}

    mock_refresh_token.assert_awaited_once_with(
        refresh_token,
        session,
    )


@pytest.mark.asyncio
@patch(
    "server.router.auth.signout_controller",
    new_callable=AsyncMock,
)
async def test_signout_router(
    mock_signout,
    client,
):
    session_token = "mock-session-token"
    refresh_token = "mock-refresh-token"

    mock_signout.return_value = {"message": "Logged out successfully"}

    client.cookies.set("session-token", session_token)
    client.cookies.set("refresh-token", refresh_token)

    response = await client.get("/api/v1/auth/signout")

    assert response.status_code == 200

    assert response.json() == {"message": "Logged out successfully"}

    mock_signout.assert_awaited_once_with(
        session_token,
        refresh_token,
    )
