#!/bin/bash

DB_USER="${DB_USER:-$USER}"
DB_NAME="${DB_NAME:-payment_gateway_test}"
DB_HOST="${DB_HOST:-/tmp}"
DB_PORT="${DB_PORT:-5433}"

PSQL="psql -U $DB_USER -h $DB_HOST -p $DB_PORT"

# Create test DB if it doesn't exist
if ! $PSQL -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" postgres | grep -q 1; then
  echo "Creating test database '$DB_NAME'..."
  $PSQL -c "CREATE DATABASE $DB_NAME" postgres
fi

# Run schema
echo "Running schema on '$DB_NAME'..."
$PSQL -d "$DB_NAME" -f "$(dirname "$0")/schema.sql"

echo "Done."
