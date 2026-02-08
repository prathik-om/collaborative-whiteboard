# Migration Testing Guide

This guide explains how to apply and verify database migrations for the Collaborative Whiteboard project.

---

## Quick Start

**1. Install dependencies:**
```bash
npm install
```

**2. Apply migrations (choose one method):**

**Option A: Automated (requires service role key)**
```bash
npm run apply-migrations
```

**Option B: Manual (recommended)**
- Go to [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor
- Copy/paste each file from `supabase/migrations/` in order:
  1. `001_initial_schema.sql`
  2. `002_rls_policies.sql`
  3. `003_realtime_setup.sql`
  4. `004_session_cleanup.sql`
  5. `005_update_rls_for_cleanup.sql`
  6. `006_add_authentication.sql`
- Click **Run** for each migration

**3. Verify migrations:**
```bash
npm run verify-migrations
```

---

## Migration Overview

### Migration 001: Initial Schema
**File:** `001_initial_schema.sql`

**What it does:**
- Creates `sessions` table (whiteboard sessions)
- Creates `participants` table (users in sessions)
- Adds indexes for performance
- Creates triggers for automatic defaults

**Verification:**
```bash
npm run verify-migrations
# Should pass: Column checks for sessions, participants
```

---

### Migration 002: RLS Policies
**File:** `002_rls_policies.sql`

**What it does:**
- Enables Row Level Security on all tables
- Creates policies for anonymous access
- Allows anyone to create/view/update sessions

**Verification:**
- Check Supabase Dashboard → Database → Tables → sessions → RLS tab
- Should see policies like "Anyone can view sessions"

---

### Migration 003: Realtime Setup
**File:** `003_realtime_setup.sql`

**What it does:**
- Configures Supabase Realtime for live collaboration
- Enables broadcast on sessions table

**Verification:**
- Check Supabase Dashboard → Database → Replication
- `sessions` table should have Realtime enabled

---

### Migration 004: Session Cleanup
**File:** `004_session_cleanup.sql`

**What it does:**
- Adds `last_activity_at` column for tracking usage
- Creates `mark_inactive_sessions()` function (runs daily at 2 AM)
- Creates `delete_old_sessions()` function (runs weekly on Sunday)
- Schedules cron jobs using pg_cron

**Verification:**
```bash
npm run verify-migrations
# Should pass: last_activity_at column, cleanup functions
```

**Manual verification (cron jobs):**
```sql
-- In Supabase SQL Editor
SELECT jobname, schedule, command
FROM cron.job
WHERE jobname IN ('mark-inactive-sessions', 'delete-old-sessions');
```

**Expected output:**
| jobname | schedule | command |
|---------|----------|---------|
| mark-inactive-sessions | 0 2 * * * | SELECT mark_inactive_sessions(); |
| delete-old-sessions | 0 3 * * 0 | SELECT delete_old_sessions(); |

---

### Migration 005: Updated RLS for Cleanup
**File:** `005_update_rls_for_cleanup.sql`

**What it does:**
- Updates RLS policies to filter inactive sessions
- Only shows `status = 'active'` sessions to users

**Verification:**
```sql
-- In Supabase SQL Editor
-- Create a test inactive session
INSERT INTO sessions (code, status, last_activity_at)
VALUES ('test-inactive-99', 'inactive', now() - interval '30 days');

-- Try to query it (should return empty due to RLS)
SELECT * FROM sessions WHERE code = 'test-inactive-99';
-- Result: No rows (RLS is working!)

-- Clean up
DELETE FROM sessions WHERE code = 'test-inactive-99';
```

---

### Migration 006: Authentication
**File:** `006_add_authentication.sql`

**What it does:**
- Adds `user_id` column (links sessions to authenticated users)
- Adds `created_by_device_id` (tracks anonymous creators)
- Adds `session_name` (user-friendly names)
- Adds `is_public` flag (private sessions)
- Creates `claim_session()` function (convert anonymous → authenticated)
- Updates RLS policies for hybrid anonymous/authenticated access

**Verification:**
```bash
npm run verify-migrations
# Should pass: user_id, created_by_device_id, session_name, is_public columns
# Should pass: claim_session() function exists
```

**Manual verification (claim function):**
```sql
-- In Supabase SQL Editor
-- List function parameters
SELECT
  routine_name,
  parameter_name,
  parameter_mode,
  data_type
FROM information_schema.parameters
WHERE routine_name = 'claim_session'
ORDER BY ordinal_position;
```

**Expected parameters:**
- `p_session_code` (text)
- `p_device_id` (text)
- `p_session_name` (text, optional)

---

## Common Issues & Solutions

### Issue: "Missing Supabase environment variables"

**Solution:**
```bash
# Make sure .env.local exists with:
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

---

### Issue: "Column does not exist" errors

**Cause:** Migration not applied

**Solution:**
1. Check which migration creates that column (see table above)
2. Go to Supabase SQL Editor
3. Copy/paste that migration file
4. Click **Run**
5. Re-run `npm run verify-migrations`

---

### Issue: "Function not found" errors

**Cause:** Function-creating migration not applied

**Solution:**
- For `claim_session`: Apply migration 006
- For `mark_inactive_sessions`: Apply migration 004
- For `delete_old_sessions`: Apply migration 004

---

### Issue: Cron jobs not showing up

**Cause:** `pg_cron` extension may not be enabled

**Solution:**
```sql
-- In Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Then re-run migration 004
```

**Note:** Some Supabase plans don't support pg_cron. If not available:
- Cron jobs won't run automatically
- You can manually run cleanup functions:
```sql
SELECT mark_inactive_sessions();
SELECT delete_old_sessions();
```

---

## Testing Session Cleanup

**1. Create a test session with old activity:**
```sql
INSERT INTO sessions (code, status, last_activity_at)
VALUES ('cleanup-test-42', 'active', now() - interval '25 hours');
```

**2. Run the cleanup function:**
```sql
SELECT mark_inactive_sessions();
```

**3. Verify it's now inactive:**
```sql
SELECT code, status, last_activity_at
FROM sessions
WHERE code = 'cleanup-test-42';
-- Should show status = 'inactive'
```

**4. Run delete function:**
```sql
-- Update to be > 7 days old
UPDATE sessions
SET last_activity_at = now() - interval '8 days'
WHERE code = 'cleanup-test-42';

SELECT delete_old_sessions();
```

**5. Verify it's deleted:**
```sql
SELECT * FROM sessions WHERE code = 'cleanup-test-42';
-- Should return no rows
```

---

## Testing Authentication

**1. Enable Supabase Auth:**
- Go to Supabase Dashboard → Authentication → Providers
- Enable **Email** provider
- (Optional) Configure email templates

**2. Test in the app:**
```bash
npm run dev
# Visit http://localhost:3000
# Click "Sign Up" in header
# Create account with email/password
# Check email for verification link
```

**3. Verify user created:**
```sql
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;
```

**4. Test session claiming:**
- Create a whiteboard (while signed in)
- Click "Save to Account"
- Enter a name
- Click "Save"
- Go to "My Sessions" → should see it there

**5. Verify in database:**
```sql
SELECT code, session_name, user_id, created_by_device_id
FROM sessions
WHERE user_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
```

---

## Verification Checklist

Use this checklist to ensure everything is set up correctly:

- [ ] All dependencies installed (`npm install`)
- [ ] All 6 migrations applied (check Supabase SQL Editor history)
- [ ] `npm run verify-migrations` passes 100%
- [ ] RLS enabled on `sessions` and `participants` tables
- [ ] Realtime enabled on `sessions` table
- [ ] Supabase Auth email provider enabled
- [ ] Cron jobs scheduled (or manual cleanup plan in place)
- [ ] Test session creation works (`npm run dev` → Create Whiteboard)
- [ ] Test authentication works (Sign Up → Verify Email → Sign In)
- [ ] Test session claiming works (Save to Account)
- [ ] Test "My Sessions" page shows saved sessions

---

## Advanced: Resetting Migrations

**⚠️ WARNING: This will delete all data!**

If you need to start fresh:

```sql
-- Drop all tables
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS mark_inactive_sessions CASCADE;
DROP FUNCTION IF EXISTS delete_old_sessions CASCADE;
DROP FUNCTION IF EXISTS claim_session CASCADE;

-- Drop cron jobs
SELECT cron.unschedule('mark-inactive-sessions');
SELECT cron.unschedule('delete-old-sessions');
```

Then re-apply all migrations in order.

---

## CI/CD Integration

To verify migrations in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Verify Database Migrations
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
  run: npm run verify-migrations
```

---

## Getting Help

If verification fails:

1. **Check logs:** Look at the error messages from `npm run verify-migrations`
2. **Manual verification:** Use SQL queries above to check specific issues
3. **Re-apply migration:** Go to SQL Editor, paste the migration, run it
4. **Check Supabase Dashboard:**
   - Database → Tables (check columns, RLS)
   - Database → Cron Jobs (check scheduled jobs)
   - Authentication → Users (check if auth is enabled)

---

## Summary

**To apply and verify all migrations:**

```bash
# 1. Install dependencies
npm install

# 2. Apply migrations manually via Supabase SQL Editor
#    (Copy/paste each file from supabase/migrations/)

# 3. Verify everything
npm run verify-migrations

# 4. Enable Supabase Auth email provider
#    (Supabase Dashboard → Authentication → Providers)

# 5. Test in the app
npm run dev
```

That's it! Your database should be fully configured and ready for production use.
