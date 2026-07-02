#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set"
  exit 1
fi

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Starting Next.js on port ${PORT:-3000}..."
exec npx next start -H 0.0.0.0 -p "${PORT:-3000}"
