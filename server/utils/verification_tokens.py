from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from server.core.config import config as cfg

EMAIL_VERIFICATION_SALT = "velmio-email-verification"

serializer = URLSafeTimedSerializer(
    secret_key=cfg.JWT_KEY, salt=EMAIL_VERIFICATION_SALT
)


def create_email_verification_token(user_id: str) -> str:

    return serializer.dumps({"user_id": user_id})


def verifiy_email_verification_token(token: str) -> str | None:

    try:
        data = serializer.loads(token, max_age=1800)

        return data["user_id"]
    except (SignatureExpired, BadSignature):
        return None
