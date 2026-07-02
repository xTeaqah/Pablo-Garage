#!/bin/sh
set -e

echo "=== Pablo Garage startup ==="
echo "PORT=${PORT:-3000}"
echo "HOSTNAME=${HOSTNAME:-0.0.0.0}"

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set"
  exit 1
fi

if [ -z "$AUTH_SECRET" ]; then
  echo "ERROR: AUTH_SECRET is not set"
  exit 1
fi

echo "DATABASE_URL is set"
echo "AUTH_SECRET is set"

PRISMA_BIN="./node_modules/.bin/prisma"
if [ ! -x "$PRISMA_BIN" ]; then
  PRISMA_BIN="npx prisma"
fi

echo "Running Prisma migrations with: $PRISMA_BIN"
attempt=1
while [ "$attempt" -le 5 ]; do
  if $PRISMA_BIN migrate deploy; then
    break
  fi
  echo "Migrate attempt $attempt failed, retrying in 5s..."
  attempt=$((attempt + 1))
  sleep 5
done

if [ "$attempt" -gt 5 ]; then
  echo "ERROR: migrations failed after 5 attempts"
  exit 1
fi

echo "Migrations complete"

if [ -f "./server.js" ]; then
  echo "Starting Next.js standalone on ${HOSTNAME:-0.0.0.0}:${PORT:-3000}..."
  exec node server.js
fi

echo "Starting Next.js on ${HOSTNAME:-0.0.0.0}:${PORT:-3000}..."
exec ./node_modules/.bin/next start -H 0.0.0.0 -p "${PORT:-3000}"
