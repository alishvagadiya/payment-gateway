#!/bin/bash

DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-payment_gateway}"
DB_HOST="${DB_HOST:-/tmp}"
DB_PORT="${DB_PORT:-5432}"

# Create DB if it doesn't exist
psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" \
  | grep -q 1 || psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -c "CREATE DATABASE $DB_NAME"

# Run schema
psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -f "$(dirname "$0")/schema.sql"

echo "Done."
