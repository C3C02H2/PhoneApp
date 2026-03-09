# Run all migrations on the database
# Usage: .\scripts\run_migrations.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

# Load env
$envFile = if (Test-Path .env.production) { ".env.production" } else { ".env" }
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^#=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
        }
    }
}

$dbUser = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "doyoutry_user" }
$dbName = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "doyoutry" }

Write-Host "Running migrations (user=$dbUser, db=$dbName)..."

$migrationPath = Join-Path $PSScriptRoot "all_migrations.sql"

# Try Docker first
try {
    $dockerCheck = docker compose ps 2>$null
    if ($LASTEXITCODE -eq 0 -and $dockerCheck -match "db") {
        Write-Host "Using Docker..."
        Get-Content $migrationPath | docker compose exec -T db psql -U $dbUser -d $dbName
    } else {
        throw "Docker not running"
    }
} catch {
    # Fallback: psql directly (requires PostgreSQL client)
    Write-Host "Using psql directly..."
    $env:PGPASSWORD = $env:POSTGRES_PASSWORD
    psql -h localhost -p 5432 -U $dbUser -d $dbName -f $migrationPath
}

Write-Host "Migrations completed."
