#!/bin/bash

# Migration Helper Script
# Guides you through applying migrations via Supabase Dashboard
#
# Usage: npm run migrations

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 Supabase Migration Helper"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Extract project ref
PROJECT_REF=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d'=' -f2 | grep -oE '[a-z]{20}' || echo "")

if [ -z "$PROJECT_REF" ]; then
  echo -e "${RED}❌ Could not find Supabase project ref${NC}"
  echo "   Check .env.local has NEXT_PUBLIC_SUPABASE_URL set"
  exit 1
fi

echo -e "${GREEN}✅ Found project: $PROJECT_REF${NC}"
echo ""

# Count migrations
MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l | tr -d ' ')

echo "📦 Found $MIGRATION_COUNT migration files"
echo ""

# Show SQL Editor URL
SQL_EDITOR_URL="https://supabase.com/dashboard/project/$PROJECT_REF/sql"

echo -e "${BLUE}🌐 Opening Supabase SQL Editor...${NC}"
echo "   URL: $SQL_EDITOR_URL"
echo ""

# Try to open in browser
if command -v open &> /dev/null; then
  open "$SQL_EDITOR_URL"
elif command -v xdg-open &> /dev/null; then
  xdg-open "$SQL_EDITOR_URL"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 INSTRUCTIONS:"
echo ""
echo "Copy and paste each migration into SQL Editor, then click Run:"
echo ""

# List migrations with file preview
for file in supabase/migrations/*.sql; do
  filename=$(basename "$file")
  size=$(ls -lh "$file" | awk '{print $5}')
  lines=$(wc -l < "$file" | tr -d ' ')

  echo -e "${YELLOW}  ▶ $filename${NC} ($size, $lines lines)"
  echo "    Location: $file"
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 TIPS:"
echo ""
echo "  • Run migrations in order (001, 002, 003...)"
echo "  • Click 'Run' for each migration"
echo "  • Check for 'Success' message after each run"
echo "  • If you see errors, check the error message"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}After applying all migrations, run:${NC}"
echo ""
echo "  npm run verify-migrations"
echo ""
echo "This will confirm all migrations were applied successfully."
echo ""
