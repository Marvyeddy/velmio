#!/bin/bash

set -e

echo "Running database migrations"

alembic -c /app/server/alembic.ini upgrade head

echo "Starting fastapi..."

exec uvicorn server.main:app --host 0.0.0.0 --port 80