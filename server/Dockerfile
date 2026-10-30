FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

COPY server/pyproject.toml server/uv.lock ./server/

RUN uv sync --frozen --no-cache --no-dev --project ./server

ENV PATH="/app/server/.venv/bin:$PATH"

COPY server ./server

RUN chmod +x server/entrypoint.sh

EXPOSE 80

CMD ["./server/entrypoint.sh"]