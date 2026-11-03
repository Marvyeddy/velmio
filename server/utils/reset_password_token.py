import hashlib
from server.external.blocklist import r

RESET_TOKEN_EXPIRY = 30 * 60


def reset_token_key(token: str) -> str:
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    return f"password-reset:{token_hash}"


async def store_reset_token(token: str) -> None:
    await r.set(
        reset_token_key(token),
        "valid",
        ex=RESET_TOKEN_EXPIRY,
    )


async def consume_reset_token(token: str) -> bool:
    # GETDEL atomically retrieves and deletes the token.
    result = await r.getdel(reset_token_key(token))
    return result == "valid"
