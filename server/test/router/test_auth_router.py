import pytest
from unittest.mock import AsyncMock, patch
from server.schemas.users import UserCreate


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
