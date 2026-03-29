#!/bin/sh
set -eu

echo "DATABASE_URL is set"
echo "Starting Nakama with custom DB config"
echo "DATABASE_URL is set"
echo "Starting Nakama with custom DB config"
echo "NAKAMA_SERVER_KEY=${NAKAMA_SERVER_KEY}"
echo "NAKAMA_HTTP_KEY=${NAKAMA_HTTP_KEY}"


/nakama/nakama migrate up --database.address "$DATABASE_URL"

exec /nakama/nakama \
  --name nakama1 \
  --database.address "$DATABASE_URL" \
  --logger.level INFO \
  --session.token_expiry_sec 7200 \
  --runtime.path /nakama/data/modules \
  --socket.server_key "${NAKAMA_SERVER_KEY}" \
  --runtime.http_key "${NAKAMA_HTTP_KEY}"