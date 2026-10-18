from urllib.parse import urlparse
import uuid
from fastapi import BackgroundTasks
import pytest
from unittest.mock import MagicMock, patch

from backend.core.security import decode_url_safe_token, create_url_safe_token
from backend.error import InvalidUserCredential, UserAlreadyExists
from backend.model.auth import Auth
from backend.route.auth_route import create_user, login_user
from backend.schema.auth_schema import UserLogin, UserRegister


@pytest.mark.asyncio
@patch("backend.route.auth_route.send_email")
async def test_create_user(mock_send_email, client):
    payload = {
        "email": "newuser@email.com",
        "password": "non-hashed password",
        "username": "newuser",
    }

    response = await client.post("/api/v1/auth/signup", json=payload)

    assert response.status_code == 201

    data = response.json()

    assert data["message"] == "User registered successfully"
    assert "session_token" in data
    assert "refresh_token" in data

    assert "session_token" in response.cookies
    assert "refresh_token" in response.cookies
    assert response.cookies["session_token"] == data["session_token"]
    assert response.cookies["refresh_token"] == data["refresh_token"]

    mock_send_email.assert_called_once()


@pytest.mark.asyncio
@patch("backend.route.auth_route.verify_password")
async def test_login_user(mock_verify, client, session):
    mock_verify.return_value = True

    user_in_db = Auth(
        id=uuid.uuid4(),
        email="newuser@email.com",
        password="hashed-password",
        username="newuser",
    )

    session.add(user_in_db)
    await session.commit()

    payload = {"email": "newuser@email.com", "password": "non-hashed-password"}

    response = await client.post("/api/v1/auth/signin", json=payload)

    assert response.status_code == 200

    data = response.json()

    assert data["message"] == "Login successful"
    assert "session_token" in data
    assert "refresh_token" in data

    assert "session_token" in response.cookies
    assert "refresh_token" in response.cookies
    assert response.cookies["session_token"] == data["session_token"]
    assert response.cookies["refresh_token"] == data["refresh_token"]


@pytest.mark.asyncio
@patch("backend.route.auth_route.send_email")
async def test_username_and_email_already_exists_direct(mock_send_email, session):
    existing_user = Auth(
        id=uuid.uuid4(),
        email="testuser@email.com",
        password="hashed-password",
        username="testuser",
    )
    session.add(existing_user)
    await session.commit()

    payload = UserRegister(
        email="testuser@email.com",
        password="non-hashed-password",
        username="testuser",
    )

    mock_bg = MagicMock(spec=BackgroundTasks)

    with pytest.raises(UserAlreadyExists):
        await create_user(bg=mock_bg, user_data=payload, session=session)

    mock_send_email.assert_not_called()


@pytest.mark.asyncio
@patch("backend.route.auth_route.verify_password")
async def test_invalid_credentials(mock_verify, session):
    mock_verify.return_value = False
    existing_user = Auth(
        id=uuid.uuid4(),
        email="testuser@email.com",
        password="hashed-password",
        username="testuser",
    )
    session.add(existing_user)
    await session.commit()

    payload = UserLogin(email="newuser@email.com", password="non-hashed-password")

    with pytest.raises(InvalidUserCredential):
        await login_user(user_data=payload, session=session)


@pytest.mark.asyncio
@patch("backend.route.auth_route.send_email")
async def test_forgot_password_success(mock_send_email, client, session):
    existing_user = Auth(
        id=uuid.uuid4(),
        email="testuser@email.com",
        password="hashed-password",
        username="testuser",
    )

    session.add(existing_user)
    await session.commit()

    response = await client.post(
        "/api/v1/auth/forgot-password",
        params={"email": "testuser@email.com"},
    )

    assert response.status_code == 200

    assert response.json() == {
        "message": ("Password reset instructions have been sent to your email.")
    }

    # Check that the email function was called once.
    mock_send_email.assert_called_once()

    # Inspect the keyword arguments passed to send_email.
    call_kwargs = mock_send_email.call_args.kwargs

    assert call_kwargs["subject"] == "Reset your Velmio password"
    assert call_kwargs["recipients"] == ["testuser@email.com"]
    assert call_kwargs["template_name"] == "reset_password.html"

    context = call_kwargs["context"]

    assert context["first_name"] == "testuser"
    assert context["expiry_minutes"] == 30

    reset_url = context["reset_url"]
    token = urlparse(reset_url).path.split("/")[-1]

    assert token

    decoded_data = decode_url_safe_token(
        token=token,
        salt=existing_user.password,
    )

    assert decoded_data["id"] == str(existing_user.id)


@pytest.mark.asyncio
@patch("backend.route.auth_route.send_email")
async def test_forgot_password_email_not_found(mock_send_email, client):
    response = await client.post(
        "/api/v1/auth/forgot-password", params={"email": "nonexistent@velmio.com"}
    )

    assert response.status_code == 404

    data = response.json()
    assert data["detail"] == "Email not found"

    mock_send_email.assert_not_called()


# =====================================================================
# Tests for GET /verify-reset-token/{token}
# =====================================================================


@pytest.mark.asyncio
async def test_verify_reset_token_success(client, session):
    # 1. Arrange: Create user and generate a real valid token
    user_id = uuid.uuid4()
    user_password = "hashed-password-string"

    user_in_db = Auth(
        id=user_id,
        email="user@velmio.com",
        password=user_password,
        username="velmiouser",
    )
    session.add(user_in_db)
    await session.commit()

    valid_token = create_url_safe_token(data={"id": str(user_id)}, salt=user_password)

    response = await client.get(f"/api/v1/auth/verify-reset-token/{valid_token}")

    # 3. Assert
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "valid"
    assert data["user_id"] == str(user_id)


@pytest.mark.asyncio
async def test_verify_reset_token_expired_or_invalid(client, session):
    user_id = uuid.uuid4()
    user_in_db = Auth(
        id=user_id,
        email="user@velmio.com",
        password="correct-current-password",
        username="velmiouser",
    )
    session.add(user_in_db)
    await session.commit()

    invalid_token = create_url_safe_token(
        data={"id": str(user_id)}, salt="old-outdated-password"
    )

    # 2. Act
    response = await client.get(f"/api/v1/auth/verify-reset-token/{invalid_token}")

    # 3. Assert
    assert response.status_code == 400
    data = response.json()
    assert (
        data["detail"]
        == "The reset link is invalid, expired, or has already been used."
    )


# =====================================================================
# Tests for POST /reset-password-submit
# =====================================================================


@pytest.mark.asyncio
@patch("backend.route.auth_route.auth_service.update_user")
async def test_reset_password_submit_success(mock_update_user, client, session):
    user_id = uuid.uuid4()
    old_password = "old-hashed-password"

    user_in_db = Auth(
        id=user_id,
        email="user@velmio.com",
        password=old_password,
        username="velmiouser",
    )
    session.add(user_in_db)
    await session.commit()

    valid_token = create_url_safe_token(data={"id": str(user_id)}, salt=old_password)

    payload = {"token": valid_token, "new_password": "brand-new-secure-password"}

    # 2. Act
    response = await client.post("/api/v1/auth/reset-password-submit", json=payload)

    # 3. Assert
    assert response.status_code == 200
    data = response.json()
    assert (
        data["message"]
        == "Password updated successfully. You can now log in with your new password"
    )

    mock_update_user.assert_called_once_with(
        user_id, {"password": "brand-new-secure-password"}, session
    )


@pytest.mark.asyncio
@patch("backend.route.auth_route.auth_service.update_user")
async def test_reset_password_submit_tampered_token(mock_update_user, client, session):
    # 1. Arrange: Create user record
    user_id = uuid.uuid4()
    user_in_db = Auth(
        id=user_id,
        email="user@velmio.com",
        password="current-password-state",
        username="velmiouser",
    )
    session.add(user_in_db)
    await session.commit()

    bad_token = create_url_safe_token(
        data={"id": str(user_id)}, salt="hacker-attempt-salt"
    )
    payload = {"token": bad_token, "new_password": "some-new-password"}

    # 2. Act
    response = await client.post("/api/v1/auth/reset-password-submit", json=payload)

    # 3. Assert
    assert response.status_code == 400
    data = response.json()
    assert (
        data["detail"]
        == "Cannot complete request. Link has expired or already been used."
    )

    mock_update_user.assert_not_called()
