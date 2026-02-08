# Migration CLI Commands - Quick Reference

## 🚀 Quick Start

```bash
# 1. Open Supabase SQL Editor and show all migrations
npm run migrations

# 2. Apply each migration manually via SQL Editor
#    (Copy/paste from files shown above)

# 3. Verify all migrations applied correctly
npm run verify-migrations
```

---

## 📋 Available Commands

### `npm run migrations`
Opens Supabase SQL Editor and lists all migrations to apply.

**Output:**
- Shows SQL Editor URL
- Lists all 6 migration files with sizes
- Provides step-by-step instructions
- Auto-opens browser to SQL Editor

**Usage:**
```bash
npm run migrations
```

---

### `npm run verify-migrations`
Checks if all migrations have been applied correctly.

**What it checks:**
- ✅ All columns exist (28 checks)
- ✅ Indexes created (5 checks)
- ✅ RLS enabled (2 checks)
- ✅ Functions exist (3 checks)
- ✅ Functional tests (3 checks)

**Output:**
- Detailed pass/fail for each check
- Summary with percentage
- Next steps if failures detected

**Usage:**
```bash
npm run verify-migrations
```

**Expected result (after applying migrations):**
```
📊 SUMMARY
   Passed: 27/27 (100%)

🎉 All migrations verified successfully!
```

---

### `npm run show-migration <number>`
Displays the content of a specific migration for easy copy-paste.

**Arguments:**
- `<number>`: Migration number (001, 002, 003, etc.)

**Usage:**
```bash
# Show migration 001
npm run show-migration 001

# Show migration 004 (session cleanup)
npm run show-migration 004

# Show migration 006 (authentication)
npm run show-migration 006
```

**Output:**
- Full SQL content of the migration
- Instructions to copy and apply

---

## 🔄 Complete Workflow

### Step 1: Prepare
```bash
# Make sure dependencies are installed
npm install

# Check current migration status
npm run verify-migrations
# (Will show 7% if migrations not applied yet)
```

### Step 2: Open SQL Editor
```bash
# Opens browser and shows migration list
npm run migrations
```

This will:
1. Extract your project ref from `.env.local`
2. Open `https://supabase.com/dashboard/project/YOUR_REF/sql`
3. Display all 6 migrations to apply

### Step 3: Apply Migrations One by One

For each migration (001 through 006):

```bash
# View migration content
npm run show-migration 001

# Copy the SQL output
# Paste into Supabase SQL Editor
# Click "Run"
# Verify "Success" message
```

**Repeat for all 6 migrations:**
- `npm run show-migration 001` → Apply → Success ✅
- `npm run show-migration 002` → Apply → Success ✅
- `npm run show-migration 003` → Apply → Success ✅
- `npm run show-migration 004` → Apply → Success ✅
- `npm run show-migration 005` → Apply → Success ✅
- `npm run show-migration 006` → Apply → Success ✅

### Step 4: Verify
```bash
npm run verify-migrations
```

Should output:
```
✅ All migrations verified successfully!
```

### Step 5: Enable Additional Features

**Enable Realtime:**
1. Supabase Dashboard → Database → Replication
2. Toggle ON for `sessions` and `participants`

**Enable Authentication:**
1. Supabase Dashboard → Authentication → Providers
2. Enable **Email** provider
3. Save

### Step 6: Test
```bash
# Start dev server
npm run dev

# Visit http://localhost:3000
# Create whiteboard → Should see format: happy-tiger-42
# Test authentication flow
```

---

## 🛠️ Troubleshooting

### Issue: "Migration 004 fails with pg_cron error"

**Error:**
```
ERROR: extension "pg_cron" is not available
```

**Solution:**
pg_cron may not be enabled on your Supabase plan. This is okay - cron jobs are optional.

**Options:**
1. **Ignore the error** - Migrations will still work, but auto-cleanup won't run
2. **Manual cleanup** - Run cleanup functions manually when needed:
   ```sql
   SELECT mark_inactive_sessions();
   SELECT delete_old_sessions();
   ```
3. **Skip cron sections** - Comment out the `SELECT cron.schedule(...)` lines in migration 004

---

### Issue: "verify-migrations shows 7%"

**Cause:** Migrations not applied yet

**Solution:**
```bash
# Run the migration helper
npm run migrations

# Apply each migration via SQL Editor
# Then verify again
npm run verify-migrations
```

---

### Issue: "Column already exists" error

**Cause:** Migration already partially applied

**Solution:**
1. Check which columns exist:
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'sessions';
   ```
2. Comment out existing column definitions in migration
3. Re-run the migration

---

### Issue: "Permission denied" errors

**Cause:** Using anon key instead of SQL Editor

**Solution:**
✅ **Always apply migrations via Supabase SQL Editor**
- SQL Editor runs with admin privileges
- API keys (anon/service) have limited permissions

---

## 📚 Migration Reference

| Migration | File | Purpose | Required |
|-----------|------|---------|----------|
| 001 | `001_initial_schema.sql` | Creates base tables | ✅ Yes |
| 002 | `002_rls_policies.sql` | Enables RLS security | ✅ Yes |
| 003 | `003_realtime_setup.sql` | Configures realtime | ✅ Yes |
| 004 | `004_session_cleanup.sql` | Auto-cleanup system | ✅ Yes |
| 005 | `005_update_rls_for_cleanup.sql` | Updates RLS policies | ✅ Yes |
| 006 | `006_add_authentication.sql` | Adds user auth | ✅ Yes |

**Total: 6 migrations, ~12 KB of SQL**

---

## 🎯 Success Criteria

After completing all steps, you should have:

- [x] All 6 migrations applied
- [x] `npm run verify-migrations` shows 100%
- [x] Realtime enabled on tables
- [x] Email authentication enabled
- [x] Dev server runs without errors
- [x] Can create sessions with format `happy-tiger-42`
- [x] Can sign up / sign in
- [x] Can save sessions to account
- [x] "My Sessions" page shows saved sessions

---

## 📞 Getting Help

**If stuck:**
1. Check error message in SQL Editor
2. Run `npm run verify-migrations` to see what's missing
3. See detailed guide: `docs/MIGRATION_TESTING.md`
4. Check migration file directly: `npm run show-migration <num>`

**Common patterns:**
```bash
# See what's failing
npm run verify-migrations

# View specific migration
npm run show-migration 004

# Re-run migration helper
npm run migrations
```

---

## ⚡ Pro Tips

**Faster copy-paste:**
```bash
# Copy migration directly to clipboard (macOS)
npm run show-migration 001 | pbcopy

# Then just paste into SQL Editor
```

**Check if already applied:**
```bash
# Quick check
npm run verify-migrations | grep "📊 SUMMARY"
```

**View all at once:**
```bash
# See all migration files
ls -lh supabase/migrations/
```

---

## 🎉 You're Done!

Once verification shows 100%, you're ready to:
- Deploy to production (see `DEPLOYMENT.md`)
- Start building features
- Test the complete auth flow

**Next:** Test the app
```bash
npm run dev
```
