import json
from unittest.mock import Mock, patch
import uuid
from fastapi import BackgroundTasks
import pytest

from server.controllers.auth import (
    auth_service,
    resend_email_verification_controller,
    verify_email_controller,
)
from server.errors import EmailAlreadyVerified, InvalidVerificationToken
from server.models.user import User
from server.utils.verification_tokens import create_email_verification_token


@pytest.mark.asyncio
async def test_verify_email_controller_invalid_token(session):

    user_id = uuid.uuid4()
    wrong_user_id = uuid.uuid4()
    user = User(
        id=user_id,
        email="newuser@email.com",
        username="newuser",
        passsword="hashed_password",
    )

    session.add(user)
    await session.commit()

    token = create_email_verification_token(str(wrong_user_id))

    with pytest.raises(InvalidVerificationToken):
        await verify_email_controller(token, session)


@pytest.mark.asyncio
async def test_verify_email_controller_email_already_verified(session):

    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        email="newuser@email.com",
        username="newuser",
        passsword="hashed_password",
        verified=True,
    )

    session.add(user)
    await session.commit()

    token = create_email_verification_token(str(user.id))

    with pytest.raises(EmailAlreadyVerified):
        await verify_email_controller(token, session)


@pytest.mark.asyncio
async def test_verify_email_controller_success(session):

    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        email="newuser@email.com",
        username="newuser",
        passsword="hashed_password",
    )

    session.add(user)
    await session.commit()

    token = create_email_verification_token(str(user.id))

    response = await verify_email_controller(token, session)

    assert user.verified
    assert response.status_code == 200

    response_data = json.loads(response.body.decode("utf-8"))
    assert response_data["message"] == "Email verified successfully"


@pytest.mark.asyncio
@patch("server.controllers.auth.send_email")
async def test_resend_email_verification_controller_success(mock_send_email, session):

    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        email="newuser@email.com",
        username="newuser",
        passsword="hashed_password",
    )

    session.add(user)
    await session.commit()

    auth_service.get_user_by_email.return_value = user

    mock_send_email.return_value = None
    mock_bg = Mock(spec=BackgroundTasks)

    response = await resend_email_verification_controller(mock_bg, user.email, session)

    assert response.status_code == 200
    response_data = json.loads(response.body.decode("utf-8"))
    assert response_data["message"] == "Email verification resent successfully"

    mock_bg.add_task.assert_called_once()

    args, kwargs = mock_bg.add_task.call_args

    assert args[0] == mock_send_email
    assert kwargs["subject"] == "Verify your velmio account"
    assert kwargs["recipients"] == ["newuser@email.com"]
    assert kwargs["template_name"] == "verify_email.html"
    assert kwargs["template_context"]["username"] == "newuser"
    assert kwargs["template_context"]["expiry_minutes"] == 30
    assert (
        f"token={create_email_verification_token(str(user.id))}"
        in kwargs["template_context"]["verification_url"]
    )
