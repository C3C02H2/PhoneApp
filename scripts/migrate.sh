#!/bin/bash
# Run migrations on the production server
# Usage: ./scripts/migrate.sh
# Or: ssh user@server "cd /path/to/PhoneApp && ./scripts/migrate.sh"

set -e
cd "$(dirname "$0")/.."

if [ -f .env.production ]; then
  set -a
  source .env.production
  set +a
fi

DB_USER="${POSTGRES_USER:-doyoutry_user}"
DB_NAME="${POSTGRES_DB:-doyoutry}"

echo "Running migrations..."
cat scripts/all_migrations.sql | docker compose --env-file .env.production exec -T db psql -U "$DB_USER" -d "$DB_NAME"
echo "Done."
