import pytest
from unittest.mock import AsyncMock, patch
from server.schemas.users import EmailRequest, UserCreate, UserLogin


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
async def test_resend_verification_email(mock_controller, client):
    email = "newuser@email.com"

    mock_controller.return_value = {"message": "Email verification resent successfully"}

    response = await client.post(
        "/api/v1/auth/resend-email-verification",
        json=EmailRequest(email=email).model_dump(),
    )

    assert response.status_code == 200
    assert response.json() == {"message": "Email verification resent successfully"}
