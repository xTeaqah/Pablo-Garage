#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is not set."
  echo "Copy it from Railway → Postgres → Connect, then run:"
  echo 'DATABASE_URL="postgresql://..." npm run db:migrate:deploy'
  exit 1
fi

echo "Running Prisma migrations..."
npx prisma migrate deploy
echo "Done. Tables should now exist in Postgres."
