FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:0.9.18 /uv /uvx /bin/

COPY server/pyproject.toml server/uv.lock ./server/

RUN uv sync --locked --no-cache --no-dev \
    --no-install-project --project ./server

ENV PATH="/app/server/.venv/bin:$PATH"

COPY server ./server

RUN uv sync --locked --no-cache --no-dev --project ./server

RUN groupadd --system velmio && \
    useradd --system --gid velmio --create-home velmio && \
    chmod +x server/entrypoint.sh && \
    chown -R velmio:velmio /app

USER velmio

EXPOSE 80

CMD ["./server/entrypoint.sh"]