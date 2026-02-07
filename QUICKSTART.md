# Quickstart Guide

Get your collaborative whiteboard running in 10 minutes!

## Prerequisites

- Node.js 18+ installed
- Git installed
- A Supabase account (free): https://supabase.com

## Step 1: Clone and Install (2 minutes)

```bash
cd /Users/prathik-5897/Desktop/Projects/collaborative-whiteboard
npm install
```

## Step 2: Set Up Supabase (5 minutes)

### 2.1 Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Fill in:
   - Name: `collaborative-whiteboard`
   - Database Password: Generate strong password (save it!)
   - Region: Choose closest to you
4. Click "Create new project"
5. Wait 2 minutes for provisioning

### 2.2 Run Migrations

1. In Supabase Dashboard, go to **SQL Editor**
2. Copy content from `supabase/migrations/001_initial_schema.sql`
3. Paste and click **Run**
4. Repeat for `002_rls_policies.sql`
5. Repeat for `003_realtime_setup.sql`

### 2.3 Enable Realtime

1. Go to **Database** → **Replication**
2. Find `sessions` table → Toggle **Realtime** ON
3. Find `participants` table → Toggle **Realtime** ON
4. Click **Save**

### 2.4 Get API Credentials

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

## Step 3: Configure Environment (1 minute)

Create `.env.local` file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and paste your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

## Step 4: Run Development Server (1 minute)

```bash
npm run dev
```

Visit http://localhost:3000

## Step 5: Test It Works! (1 minute)

### Test 1: Create Whiteboard
1. Click "Create Whiteboard"
2. You should see a canvas
3. Try drawing → it works!

### Test 2: Collaborative Sync
1. Click "Copy Link" button
2. Open link in **incognito window**
3. Draw in first window → it appears in second window!
4. Draw in second window → it appears in first window!

**✅ If both tests pass, you're done!**

---

## Troubleshooting

### "Missing Supabase environment variables"
- Check `.env.local` exists in project root
- Check values are correct (no quotes, no spaces)
- Restart dev server: `Ctrl+C` then `npm run dev`

### "Failed to create session"
- Check migrations ran in Supabase SQL Editor
- Go to Supabase → Logs → Look for errors
- Verify RLS policies are enabled

### Canvas doesn't sync between windows
- Check Realtime is enabled (Database → Replication)
- Check browser console for errors (F12)
- Try refreshing both windows

### Build fails
```bash
npm run type-check  # Check for TypeScript errors
npm run lint        # Check for linting errors
```

---

## Next Steps

1. **Deploy to production:** See [DEPLOYMENT.md](DEPLOYMENT.md)
2. **Customize session codes:** Edit `utils/sessionCode.ts`
3. **Add templates:** Coming in Phase 2
4. **Add productivity tools:** Coming in Phase 4

---

## Architecture Overview

```
User clicks "Create Whiteboard"
  → Next.js creates session in Supabase
  → Generates random code (e.g., "happy-tiger")
  → User shares code with friends
  → Friends join via code
  → Everyone draws on tldraw canvas
  → Changes broadcast via Supabase Realtime
  → All users see updates in real-time
```

**Tech Stack:**
- **Frontend:** Next.js 15 + React 18 + TypeScript
- **Canvas:** tldraw (collaborative whiteboard)
- **Database:** Supabase (PostgreSQL + Realtime)
- **Hosting:** Vercel (recommended)

---

**Questions?** Check [README.md](README.md) or [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
