import math
from datetime import datetime, timezone

import redis.asyncio as aioredis

from server.constants import SESSION_EXPIRY
from server.core.config import config as cfg


r = aioredis.from_url(
    url=cfg.REDIS_URL,
    decode_responses=True,
    socket_connect_timeout=5.0,
    socket_timeout=5.0,
    health_check_interval=30,
)


def get_remaining_expiry(token_data: dict) -> int:
    exp = token_data.get("exp")

    if not isinstance(exp, (int, float)):
        return 0

    remaining = exp - datetime.now(timezone.utc).timestamp()

    return max(0, math.ceil(remaining))


async def add_token_to_blocklist(
    token: str,
    expiry: int = SESSION_EXPIRY,
) -> bool:
    if not token or expiry <= 0:
        return False

    result = await r.set(
        name=f"blocklist:{token}",
        value="revoked",
        ex=expiry,
        nx=True,
    )

    return result is True


async def token_in_blocklist(token: str) -> bool:
    if not token:
        return False

    return bool(await r.exists(f"blocklist:{token}"))
