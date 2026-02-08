#!/bin/bash

# Push Migrations Script
# Applies all migrations to your Supabase database via CLI
#
# Usage: npm run push-migrations

set -e

echo "🚀 Pushing Migrations to Supabase..."
echo ""

# Extract project ref from .env.local
PROJECT_REF=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d'=' -f2 | grep -oE '[a-z]{20}')

if [ -z "$PROJECT_REF" ]; then
  echo "❌ Could not extract project ref from .env.local"
  echo "   Make sure NEXT_PUBLIC_SUPABASE_URL is set"
  exit 1
fi

echo "📦 Project ref: $PROJECT_REF"
echo ""

# Check if migrations directory exists
if [ ! -d "supabase/migrations" ]; then
  echo "❌ Migrations directory not found: supabase/migrations"
  exit 1
fi

# Login check
echo "🔐 Checking Supabase CLI authentication..."
if ! supabase projects list &>/dev/null; then
  echo ""
  echo "⚠️  You need to login to Supabase CLI first"
  echo ""
  echo "Run this command:"
  echo "  supabase login"
  echo ""
  echo "Then run this script again:"
  echo "  npm run push-migrations"
  echo ""
  exit 1
fi

echo "✅ Authenticated"
echo ""

# Link project if not already linked
echo "🔗 Linking to Supabase project..."
if [ ! -f ".supabase/config.toml" ]; then
  echo "   Linking project..."
  supabase link --project-ref $PROJECT_REF || {
    echo ""
    echo "❌ Failed to link project"
    echo ""
    echo "Please link manually:"
    echo "  supabase link --project-ref $PROJECT_REF"
    echo ""
    exit 1
  }
else
  echo "✅ Already linked"
fi

echo ""

# Push migrations
echo "📤 Pushing migrations to database..."
echo ""

supabase db push || {
  echo ""
  echo "❌ Failed to push migrations"
  echo ""
  echo "💡 Alternative: Apply migrations manually via Supabase Dashboard"
  echo "   Go to: https://supabase.com/dashboard/project/$PROJECT_REF/sql"
  echo "   Copy/paste each migration file from supabase/migrations/"
  echo ""
  exit 1
}

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Migrations applied successfully!"
echo ""
echo "Next step: Verify migrations"
echo "  npm run verify-migrations"
echo ""
