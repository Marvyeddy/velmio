import json
import uuid
import pytest

from server.controllers.auth import verify_email_controller
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
