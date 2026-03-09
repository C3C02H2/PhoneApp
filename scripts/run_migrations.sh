#!/bin/bash
# Run all migrations on the database
# Usage: ./scripts/run_migrations.sh
# Or with docker: docker compose exec db psql -U $POSTGRES_USER -d $POSTGRES_DB -f - < scripts/all_migrations.sql

set -e
cd "$(dirname "$0")/.."

# Load env from .env.production or .env
if [ -f .env.production ]; then
  set -a
  source .env.production
  set +a
elif [ -f .env ]; then
  set -a
  source .env
  set +a
fi

DB_USER="${POSTGRES_USER:-doyoutry_user}"
DB_NAME="${POSTGRES_DB:-doyoutry}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

echo "Running migrations (user=$DB_USER, db=$DB_NAME)..."

if command -v docker &> /dev/null && docker compose ps 2>/dev/null | grep -q db; then
  echo "Using Docker..."
  cat scripts/all_migrations.sql | docker compose exec -T db psql -U "$DB_USER" -d "$DB_NAME"
else
  echo "Using psql directly..."
  PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f scripts/all_migrations.sql
fi

echo "Migrations completed."
