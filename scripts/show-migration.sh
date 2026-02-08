#!/bin/bash

# Show Migration Content
# Displays a specific migration file for easy copy-paste
#
# Usage: npm run show-migration 001

MIGRATION_NUM=$1

if [ -z "$MIGRATION_NUM" ]; then
  echo "Usage: npm run show-migration <number>"
  echo ""
  echo "Example: npm run show-migration 001"
  echo ""
  echo "Available migrations:"
  ls -1 supabase/migrations/*.sql | sed 's/.*\//  - /'
  exit 1
fi

# Find migration file
MIGRATION_FILE=$(ls supabase/migrations/${MIGRATION_NUM}*.sql 2>/dev/null | head -1)

if [ -z "$MIGRATION_FILE" ]; then
  echo "❌ Migration $MIGRATION_NUM not found"
  echo ""
  echo "Available migrations:"
  ls -1 supabase/migrations/*.sql | sed 's/.*\//  - /'
  exit 1
fi

FILENAME=$(basename "$MIGRATION_FILE")

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📄 $FILENAME"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cat "$MIGRATION_FILE"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 To apply:"
echo "  1. Copy the SQL above (select all)"
echo "  2. Paste into Supabase SQL Editor"
echo "  3. Click 'Run'"
echo ""
