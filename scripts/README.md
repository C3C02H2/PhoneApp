# Database migrations

## Run migrations on server (SSH)

```bash
cd /path/to/PhoneApp
./scripts/migrate.sh
```

Or with Docker Compose directly:

```bash
cat scripts/all_migrations.sql | docker compose --env-file .env.production exec -T db psql -U doyoutry_user -d doyoutry
```

## Run migrations locally (Docker)

```bash
# Start containers first
docker compose up -d db

# Run migrations (load .env or .env.production for credentials)
./scripts/run_migrations.sh
```

## Run with pgAdmin

1. Connect to your database
2. Open `scripts/all_migrations.sql`
3. Execute (F5)
