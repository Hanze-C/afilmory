#!/bin/sh
set -eu

echo "[entrypoint] Running database migrations..."
node ./dist/main.js db:migrate

echo "[entrypoint] Starting application..."
exec "$@"


