#!/bin/sh
set -e

# Run Alembic migrations
echo "Running database migrations..."
alembic upgrade head

# Start the application
echo "Starting server on port ${PORT:-8000}..."
exec gunicorn app.main:app \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind "0.0.0.0:${PORT:-8000}" \
  --workers 2 \
  --timeout 120
