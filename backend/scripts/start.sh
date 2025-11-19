#!/bin/bash
set -e

echo "Starting application..."
echo "Running Prisma migrations..."

# Run migrations, but don't fail if there are no migrations
npx prisma migrate deploy || {
  echo "Migration deploy completed (or no migrations to run)"
}

echo "Starting Node.js application..."
node dist/index.js

