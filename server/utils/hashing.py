from argon2.exceptions import VerifyMismatchError
from argon2 import PasswordHasher
from server.core.logging import get_app_logger

logger = get_app_logger(__name__)

pwd = PasswordHasher()


def hash_pwd(password: str) -> str:

    return pwd.hash(password)


def verify_pwd(hash: str, password: str) -> bool:

    try:
        return pwd.verify(hash=hash, password=password)
    except VerifyMismatchError as e:
        logger.error("Password verification failed: %s", str(e))
        return False
