#!/bin/bash

# Direct Migration Runner
# Runs migrations using direct database connection
#
# Usage: npm run run-migrations

set -e

echo ""
echo "🚀 Running Migrations via Direct Database Connection"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql not found"
    echo ""
    echo "Please install PostgreSQL client:"
    echo "  brew install postgresql@15"
    echo ""
    echo "Or use the SQL Editor method:"
    echo "  npm run migrations"
    echo ""
    exit 1
fi

# Get database password
if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo "⚠️  Database password not set"
    echo ""
    echo "Please set SUPABASE_DB_PASSWORD in .env.local or export it:"
    echo ""
    echo "  export SUPABASE_DB_PASSWORD='your-database-password'"
    echo "  npm run run-migrations"
    echo ""
    echo "Get your password from:"
    echo "  https://supabase.com/dashboard/project/qjmpwmoudmjvtrwugnsw/settings/database"
    echo ""
    exit 1
fi

# Database connection details
DB_HOST="aws-0-us-east-1.pooler.supabase.com"
DB_PORT="6543"
DB_NAME="postgres"
DB_USER="postgres.qjmpwmoudmjvtrwugnsw"

echo "📦 Database: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""

# Test connection
echo "🔌 Testing connection..."
if ! PGPASSWORD="$SUPABASE_DB_PASSWORD" psql "postgresql://$DB_USER:$SUPABASE_DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=require" -c "SELECT 1;" &>/dev/null; then
    echo "❌ Connection failed"
    echo ""
    echo "Please check:"
    echo "  1. Database password is correct"
    echo "  2. Database is accessible"
    echo ""
    exit 1
fi

echo "✅ Connected"
echo ""

# Run migrations
MIGRATIONS_DIR="supabase/migrations"
SUCCESS_COUNT=0
FAIL_COUNT=0

for migration in "$MIGRATIONS_DIR"/*.sql; do
    filename=$(basename "$migration")
    echo "📝 Running $filename..."

    if PGPASSWORD="$SUPABASE_DB_PASSWORD" psql "postgresql://$DB_USER:$SUPABASE_DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=require" -f "$migration" &>/dev/null; then
        echo "   ✅ Success"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo "   ❌ Failed (see error above)"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Summary: $SUCCESS_COUNT succeeded, $FAIL_COUNT failed"
echo ""

if [ $FAIL_COUNT -gt 0 ]; then
    echo "⚠️  Some migrations failed"
    echo ""
    echo "Run with verbose output to see errors:"
    echo "  PGPASSWORD='your-password' psql 'postgresql://$DB_USER:password@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=require' -f supabase/migrations/001_initial_schema.sql"
    echo ""
    exit 1
fi

echo "✅ All migrations completed successfully!"
echo ""
echo "Next: npm run verify-migrations"
echo ""
