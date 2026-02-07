# Deployment Guide

## Deploy to Vercel (Recommended)

### Prerequisites
- Vercel account (free): https://vercel.com
- Supabase project set up (see [SUPABASE_SETUP.md](SUPABASE_SETUP.md))
- Git repository pushed to GitHub

### Step 1: Push to GitHub

```bash
# Create a new repository on GitHub, then:
git remote add origin https://github.com/your-username/collaborative-whiteboard.git
git branch -M main
git push -u origin main
```

### Step 2: Connect to Vercel

1. Go to https://vercel.com/new
2. Click "Import Project"
3. Select your GitHub repository
4. Vercel will auto-detect Next.js settings

### Step 3: Configure Environment Variables

In Vercel project settings → Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

Get these values from:
- Supabase Dashboard → Settings → API

### Step 4: Deploy

1. Click "Deploy"
2. Wait ~2 minutes for build to complete
3. Visit your production URL (e.g., `https://collaborative-whiteboard.vercel.app`)

### Step 5: Test Production

1. Visit production URL
2. Click "Create Whiteboard"
3. Open same URL in incognito window
4. Paste session code
5. Draw in both windows → verify real-time sync works

---

## Alternative: Deploy to Other Platforms

### Netlify

1. Connect GitHub repo
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Add environment variables
5. Deploy

### Self-Hosted (Node.js)

```bash
npm run build
npm start
```

Runs on http://localhost:3000

For production, use a process manager like PM2:
```bash
npm install -g pm2
pm2 start npm --name "whiteboard" -- start
pm2 save
pm2 startup
```

---

## Post-Deployment Checklist

- [ ] Production URL loads successfully
- [ ] Can create new whiteboard session
- [ ] Can join session with code
- [ ] Real-time sync works between users
- [ ] Session code copy button works
- [ ] No console errors in browser
- [ ] Supabase RLS policies working (check Supabase logs)

---

## Monitoring & Debugging

### Vercel Logs
- Dashboard → Your Project → Deployments → Click deployment → Runtime Logs

### Supabase Logs
- Dashboard → Logs → Filter by table (`sessions`, `participants`)

### Common Issues

**"Missing Supabase environment variables"**
- Check env vars are set in Vercel project settings
- Redeploy after adding env vars

**Real-time sync not working**
- Check Realtime is enabled in Supabase (Database → Replication)
- Check browser console for WebSocket errors
- Verify RLS policies allow inserts/updates

**Session creation fails**
- Check database migrations ran successfully
- Verify RLS policies are correct
- Check Supabase logs for errors

---

## Performance Optimization

### Enable Vercel Analytics (Optional)
```bash
npm install @vercel/analytics
```

Add to `app/layout.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react';

// In component:
<Analytics />
```

### Enable Edge Functions (Optional)

For lower latency, deploy to Vercel Edge:

In `next.config.ts`:
```typescript
export const runtime = 'edge';
```

---

## Scaling Considerations

**Current architecture supports:**
- ~100 concurrent sessions
- ~10 users per session
- Supabase free tier: 500MB database, 2GB bandwidth/month

**If you exceed free tier limits:**
- Upgrade to Supabase Pro ($25/month)
- Add Redis caching for session data
- Implement connection pooling
- Use Vercel Pro for better performance ($20/month)

---

## Security Hardening (Production)

1. **Add rate limiting:**
   - Limit session creation to 5/minute per IP
   - Use Vercel Edge Functions for IP-based throttling

2. **Add session expiration:**
   - Auto-delete sessions after 24 hours of inactivity
   - Add cron job to clean up old sessions

3. **Add Content Security Policy:**
   - Add CSP headers in `next.config.ts`
   - Restrict external script sources

4. **Monitor abuse:**
   - Check Supabase logs for suspicious activity
   - Add alerts for unusual session creation patterns

---

For help, see [README.md](README.md) or open an issue on GitHub.
