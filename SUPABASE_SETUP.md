# Supabase Setup Guide

## Step 1: Create New Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Fill in:
   - **Name:** collaborative-whiteboard
   - **Database Password:** (Generate a strong password - save it!)
   - **Region:** Choose closest to your location
   - **Pricing Plan:** Free tier is fine for MVP
4. Click "Create new project"
5. Wait ~2 minutes for project to be provisioned

## Step 2: Get API Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

## Step 3: Configure Environment Variables

1. In your project root, create `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` with your credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   ```

## Step 4: Run Database Migrations

**Option A: Automated (recommended)**
```bash
# Install dependencies first
npm install

# Verify migrations
npm run verify-migrations
```

**Option B: Manual**
1. In Supabase dashboard, go to **SQL Editor**
2. Copy and paste each migration file from `supabase/migrations/` in order:
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`
   - `003_realtime_setup.sql`
   - `004_session_cleanup.sql` ← **NEW**
   - `005_update_rls_for_cleanup.sql` ← **NEW**
   - `006_add_authentication.sql` ← **NEW**
3. Click **Run** for each migration
4. Verify: `npm run verify-migrations`

📚 **See detailed migration guide:** [docs/MIGRATION_TESTING.md](docs/MIGRATION_TESTING.md)

## Step 5: Enable Realtime & Authentication

**Realtime:**
1. Go to **Database** → **Replication**
2. Find tables: `sessions`, `participants`
3. Toggle **Realtime** ON for both tables
4. Click **Save**

**Authentication:**
1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. (Optional) Customize email templates
4. Click **Save**

## Step 6: Verify Setup

1. Run the development server:
   ```bash
   npm run dev
   ```

2. Visit http://localhost:3000
3. Click "Create Whiteboard"
4. If you see a whiteboard canvas, setup is complete! 🎉

## Troubleshooting

**Error: "Missing Supabase environment variables"**
- Check `.env.local` exists and has correct values
- Restart dev server after changing env vars

**Error: "Failed to create session"**
- Check migrations ran successfully in SQL Editor
- Verify RLS policies are enabled

**Canvas doesn't sync across tabs**
- Check Realtime is enabled for `sessions` table
- Check browser console for WebSocket errors

## Next Steps

- Test authentication flow (Sign Up → Verify → Save Session)
- Check cron jobs: Database → Cron Jobs (should see cleanup jobs)
- Deploy to production (see DEPLOYMENT.md)
- Customize session code adjectives/animals

## Verification

Run automated checks:
```bash
npm run verify-migrations
```

Should output: `🎉 All migrations verified successfully!`

See [docs/MIGRATION_TESTING.md](docs/MIGRATION_TESTING.md) for detailed testing guide.
