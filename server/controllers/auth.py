from fastapi import BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from server.errors import UserAlreadyExists
from server.external.email import send_email
from server.schemas.users import UserCreate
from server.services.auth import AuthService
from server.utils.verification_tokens import create_email_verification_token
from server.core.config import config as cfg
from server.core.logging import get_app_logger

auth_service = AuthService()
logger = get_app_logger(__name__)


async def signup_controller(
    bg: BackgroundTasks, user_data: UserCreate, session: AsyncSession
):
    user_dict = user_data.model_dump()
    logger.info(
        f"Signup attempt started for user: {user_dict.get('username')} (Email: {user_dict.get('email')})"
    )

    existing_username = await auth_service.get_user_by_username(
        user_dict["username"], session
    )
    if existing_username:
        logger.warning(
            f"Signup failed: Username '{user_dict['username']}' already exists."
        )
        raise UserAlreadyExists()

    existing_email = await auth_service.get_user_by_email(user_dict["email"], session)
    if existing_email:
        logger.warning(f"Signup failed: Email '{user_dict['email']}' already exists.")
        raise UserAlreadyExists()

    logger.info(f"Creating new user record for: {user_dict['username']}")
    new_user = await auth_service.create_user(user_dict, session)

    token = create_email_verification_token(str(new_user.id))
    verification_url = f"{cfg.FRONTEND_URL}/verify-email?token={token}"

    logger.info(
        f"Scheduling email verification background task for user ID: {new_user.id}"
    )
    bg.add_task(
        send_email,
        subject="Verify your velmio account",
        recipients=[new_user.email],
        template_name="verify_email.html",
        template_context={
            "username": new_user.username,
            "verification_url": verification_url,
            "expiry_minutes": 30,
        },
    )

    logger.info(f"User {new_user.username} (ID: {new_user.id}) signed up successfully.")
    return {"message": "User Signed up successfully"}
