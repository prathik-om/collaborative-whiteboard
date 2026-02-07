# Collaborative Whiteboard - Development Guidelines

> **Purpose:** This file guides Claude Code in building our real-time collaborative whiteboard. It encodes our architectural decisions, common pitfalls, and quality standards so every AI-assisted coding session builds on accumulated knowledge.

---

## 🎯 Project Vision

We're building a free, anonymous, real-time collaborative whiteboard for students and study groups. No friction—just share a code and draw together.

**Our core principle:** Simplicity enables collaboration. Remove all barriers between idea and canvas.

**Use cases:**
- Study groups working on problem sets
- Remote pair programming on whiteboards
- Brainstorming sessions
- Project planning and mind mapping
- Homework collaboration

---

## 🚀 Current Status

**PROJECT STATUS:** Phase 1 MVP Complete (2026-02-07)
- ✅ Core functionality deployed and tested
- ✅ tldraw integration with real-time sync
- ✅ Anonymous session creation with memorable codes
- ✅ Complete documentation (4 setup guides)
- ✅ TypeScript strict mode (0 errors)
- ⚠️ Tests configured (but not written yet - needs 80%+ coverage before production)

**Phase 1 Features (COMPLETE):**
- ✅ **Real-Time Collaborative Canvas** - Multiple users draw simultaneously
  - tldraw CRDT (automatic conflict resolution)
  - Supabase Realtime broadcast (WebSocket-based)
  - Late-joiner recovery (full canvas state sync)
- ✅ **Anonymous Session Creation** - No account required
  - Memorable codes: `happy-tiger`, `bright-eagle` format
  - 528 unique combinations (24 adjectives × 22 animals)
- ✅ **Study Group Sessions** - Default collaborative mode
  - No permission restrictions (everyone can draw)
  - Perfect for homework, brainstorming, projects
- ✅ **Connection Status** - Real-time indicator
  - Green = connected, yellow = connecting
  - Participant count (placeholder)

**Production Readiness:** ~70%
- ✅ Code is functional and deployable
- ✅ TypeScript strict mode passing
- ✅ Real-time sync working
- ⚠️ Missing: Tests (critical), error handling, mobile validation, rate limiting

**Next Steps:**
- Write test suite (target: 80%+ coverage) - **BLOCKER for production**
- Test mobile device experience
- Implement error boundaries and fallback UI
- Add rate limiting (session creation, broadcast frequency)
- Deploy to Vercel staging environment
- Begin Phase 2: Templates (brainstorm, project plan, mind map)

---

## 🏗️ Tech Stack & Architecture

### **Frontend**
- **Framework:** Next.js 15.1.6 App Router (NOT Pages directory)
  - Use `app/` directory structure
  - Server Components by default, Client Components only when needed
  - File-based routing: `app/board/page.tsx`
- **Canvas:** tldraw 2.4.6 (CRDT-based collaborative whiteboard)
  - Import: `import { Tldraw } from '@tldraw/tldraw'`
  - Handles conflict resolution automatically
- **Styling:** Tailwind CSS 3.4.1
  - Use utility classes, no custom CSS files
  - Mobile-first responsive design
- **State Management:** React hooks (useState, useEffect, useRef)
  - No Redux, Zustand, or external state libraries
  - Keep it simple for MVP

### **Backend & Database**
- **Database:** Supabase (PostgreSQL + real-time)
  - Use Supabase Realtime for live features (NOT Socket.io)
  - Row Level Security (RLS) policies on all tables
  - TypeScript types generated from schema
- **Authentication:** None (anonymous by design)
  - Device-based identification (client-generated UUID)
  - Session codes for access control
- **API Routes:** Next.js Route Handlers in `app/api/`
  - Validate all inputs
  - Return proper HTTP status codes

### **Real-Time Communication**
- **Primary:** Supabase Realtime broadcast
  - Canvas state sync: Bidirectional between all participants
  - Ephemeral messages (no database writes)
  - ~50-100ms latency (acceptable for drawing)
- **Fallback:** WebSockets/Socket.io ONLY if Supabase has performance issues

### **Development & Testing**
- **Testing:** Jest 29.7.0 + @testing-library/react 14.1.2
- **Linting:** ESLint 8.x with Next.js config
- **Type Checking:** TypeScript strict mode

### **Hosting**
- **Platform:** Vercel (recommended, auto-deploys from GitHub)
- **Alternative:** Netlify, self-hosted Node.js

---

## ⚠️ Common Mistakes & How to Avoid Them

### **Architecture & Code Structure**

**❌ DON'T:**
- Create files over 300 lines (break into smaller components)
- Mix Server and Client Components without `'use client'` directive
- Put business logic in page components (use separate hooks/utils)
- Assume data exists (always handle loading/error states)
- Over-abstract on first iteration (YAGNI principle)

**✅ DO:**
- Keep components focused (one responsibility)
- Use TypeScript strict mode (catch errors early)
- Write clear, descriptive variable names (`sessionCode` not `sc`)
- Add comments for "why" not "what" (code shows what, comments explain why)
- Extract repeated logic into utility functions

**Example - Good component structure:**
```typescript
// ❌ BAD: 500-line component doing everything
export default function WhiteboardPage() {
  // 500 lines of mixed concerns...
}

// ✅ GOOD: Modular, focused components
export default function WhiteboardPage() {
  return (
    <div>
      <WhiteboardCanvas sessionCode={sessionCode} />
      <ConnectionStatus sessionCode={sessionCode} />
      <ParticipantList sessionCode={sessionCode} />
    </div>
  )
}
```

---

### **TLDraw Integration**

**❌ DON'T:**
- Try to customize TLDraw's internal rendering (too complex)
- Store canvas state in React state (use TLDraw's built-in store)
- Sync every brush stroke (too much data, high latency)
- Forget to handle TLDraw loading state

**✅ DO:**
- Use TLDraw's `onChange` prop for state sync (debounced every 500ms)
- Store snapshots as JSON in Supabase (not the full TLDraw store)
- Make canvas read-only when needed (no toolbar for viewers)
- Test canvas performance with 10+ concurrent users

**Example - Canvas sync pattern:**
```typescript
// ✅ GOOD: Debounced sync to avoid overwhelming Supabase
const debouncedSync = useMemo(
  () => debounce((snapshot) => {
    supabase.from('sessions')
      .update({ canvas_snapshot: snapshot })
      .eq('code', sessionCode)
  }, 500),
  [sessionCode]
)

<Tldraw onChange={(editor) => {
  const snapshot = editor.store.getSnapshot()
  debouncedSync(snapshot)
}} />
```

---

### **Real-Time Features**

**❌ DON'T:**
- Poll the database (use Supabase Realtime subscriptions)
- Forget to unsubscribe when component unmounts (memory leaks)
- Send entire canvas state on every update (use diffs/deltas)
- Ignore race conditions (multiple users updating simultaneously)

**✅ DO:**
- Subscribe to specific channels (`session:${sessionCode}`)
- Clean up subscriptions in useEffect cleanup
- Debounce rapid updates (canvas strokes)
- Handle connection drops gracefully (reconnect logic)

**Example - Realtime subscription:**
```typescript
// ✅ GOOD: Proper subscription with cleanup
useEffect(() => {
  const channel = supabase
    .channel(`session:${sessionCode}`)
    .on('broadcast', {
      event: 'canvas_changes'
    }, (payload) => {
      // Update local state with new canvas
      applyCanvasChanges(payload)
    })
    .subscribe()

  return () => {
    channel.unsubscribe() // Cleanup!
  }
}, [sessionCode])
```

---

### **Database & Data Modeling**

**❌ DON'T:**
- Skip RLS policies (security vulnerability)
- Store binary data in PostgreSQL (use Supabase Storage if needed)
- Create tables without timestamps (always add created_at, updated_at)
- Forget indexes on frequently queried columns

**✅ DO:**
- Use UUIDs for primary keys (not auto-increment integers)
- Add foreign key constraints (maintain referential integrity)
- Use JSONB for flexible data (canvas snapshots)
- Test queries with EXPLAIN ANALYZE (check performance)

**Schema guidelines:**
```sql
-- ✅ GOOD: Well-structured table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  canvas_snapshot JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Add RLS policy
CREATE POLICY "Anyone can read active sessions"
  ON sessions FOR SELECT
  USING (status = 'active');

-- Add indexes for common queries
CREATE INDEX idx_sessions_code ON sessions(code);
CREATE INDEX idx_sessions_status ON sessions(status) WHERE status = 'active';
```

---

### **UI/UX Patterns**

**❌ DON'T:**
- Build complex layouts from scratch (use Tailwind components)
- Forget loading states (users see blank screens)
- Ignore mobile users (50% will use phones)
- Make buttons/touch targets < 44px (accessibility)

**✅ DO:**
- Show skeleton screens while loading
- Use optimistic updates (feel instant, confirm later)
- Design mobile-first, enhance for desktop
- Test on actual phones, not just browser DevTools

**Loading state pattern:**
```typescript
// ✅ GOOD: Graceful loading with skeleton
export function WhiteboardCanvas({ sessionCode }) {
  const { data: session, isLoading } = useSession(sessionCode)

  if (isLoading) {
    return <WhiteboardSkeleton />
  }

  return <Tldraw snapshot={session.canvas_snapshot} />
}
```

---

## 🎨 Code Style & Quality Standards

### **TypeScript**
- **Always use TypeScript strict mode** (tsconfig.json: `"strict": true`)
- Define interfaces for all props, API responses, database rows
- Use type inference where obvious, explicit types where clarity matters
- Avoid `any` type (use `unknown` if truly dynamic)

**Example:**
```typescript
// ❌ BAD: Using 'any'
function updateCanvas(data: any) { ... }

// ✅ GOOD: Explicit types
interface CanvasSnapshot {
  shapes: TLDrawShape[]
  timestamp: number
}

function updateCanvas(snapshot: CanvasSnapshot) { ... }
```

### **Naming Conventions**
- **Components:** PascalCase (`WhiteboardCanvas.tsx`)
- **Functions:** camelCase (`generateSessionCode`)
- **Constants:** SCREAMING_SNAKE_CASE (`MAX_PARTICIPANTS_PER_SESSION`)
- **Database tables:** snake_case (`sessions`, `participants`)
- **Files:** kebab-case for utilities (`session-code.ts`)

### **File Organization**
```
app/
├── page.tsx                # Landing page (Create button)
├── board/
│   └── page.tsx            # Whiteboard canvas page
├── api/
│   └── sessions/
│       └── route.ts        # API endpoints
components/
├── WhiteboardCanvas.tsx    # tldraw integration
├── ConnectionStatus.tsx    # Connection indicator
└── ParticipantList.tsx     # List of participants
hooks/
├── useCreateSession.ts     # Session creation hook
├── useBroadcastChannel.ts  # Real-time subscription
└── useSession.ts           # Fetch session data
lib/
├── supabase.ts             # Supabase client
types/
└── database.types.ts       # Generated from Supabase
utils/
└── sessionCode.ts          # Session code generation
```

### **Comments & Documentation**
- **When to comment:** Complex logic, non-obvious decisions, workarounds, TODOs
- **When NOT to comment:** Obvious code, redundant explanations

```typescript
// ❌ BAD: Stating the obvious
// Set session code to 'happy-tiger'
setSessionCode('happy-tiger')

// ✅ GOOD: Explaining WHY
// Use memorable animal-based codes instead of random strings
// so users can verbally share codes with study group members
setSessionCode(generateSessionCode())
```

---

## 🧪 Testing Requirements

### **What MUST be tested:**
- API routes (request validation, error handling)
- Database queries (correct data returned, RLS policies work)
- Real-time sync (messages received, state updates correctly)
- Edge cases (empty states, max capacity, network failures)

### **What CAN be tested later:**
- UI components (snapshot tests)
- E2E flows (Playwright tests)

### **Testing stack:**
- **Unit tests:** Jest + @testing-library/react
- **Integration tests:** Jest + Supabase test client
- **E2E tests:** Playwright (Phase 2)

**Example test:**
```typescript
// hooks/useCreateSession.test.ts
import { describe, it, expect } from '@jest/globals'
import { renderHook, waitFor } from '@testing-library/react'
import { useCreateSession } from './useCreateSession'

describe('useCreateSession', () => {
  it('creates session with valid code format', async () => {
    const { result } = renderHook(() => useCreateSession())

    await waitFor(() => {
      expect(result.current.session).toBeDefined()
      expect(result.current.session.code).toMatch(/^[a-z]+-[a-z]+$/)
    })
  })

  it('handles collision by retrying', async () => {
    // Test retry logic when code already exists
    const { result } = renderHook(() => useCreateSession())

    await waitFor(() => {
      expect(result.current.session).toBeDefined()
      expect(result.current.error).toBeNull()
    })
  })
})
```

---

## 🚀 Performance Guidelines

### **Critical Metrics:**
- **Canvas sync latency:** < 100ms (user draws → others see)
- **Page load time:** < 2 seconds (Time to Interactive)
- **Supported concurrent users:** 30 users per session

### **Optimization Strategies:**
- **Debounce rapid updates** (canvas strokes every 500ms, not 60Hz)
- **Use React.memo for expensive components** (WhiteboardCanvas)
- **Lazy load routes** (use Next.js dynamic imports)
- **Monitor bundle size** (keep under 500KB initial load)

### **When to optimize:**
- ✅ Profile FIRST, optimize SECOND (use Chrome DevTools Performance tab)
- ✅ Measure actual impact (before/after metrics)
- ❌ Don't premature optimize (avoid complexity for <10% gains)

---

## 🛡️ Security & Privacy

### **CRITICAL: Never Do This**
- ❌ Expose Supabase anon key in Git (use environment variables)
- ❌ Store sensitive data in localStorage (session codes are okay)
- ❌ Trust client-side data (always validate server-side)
- ❌ Skip input sanitization (prevent XSS)

### **MUST Do This**
- ✅ Use environment variables for all secrets (`.env.local`, NOT committed)
- ✅ Validate ALL user inputs with Zod schemas
- ✅ Enable RLS on ALL Supabase tables
- ✅ Sanitize user-generated content (nicknames)
- ✅ Rate limit session creation (5 per minute per device)

**Environment variables:**
```bash
# .env.local (NEVER commit this file)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**Input validation:**
```typescript
// ✅ GOOD: Validate with Zod
import { z } from 'zod'

const CreateSessionSchema = z.object({
  nickname: z.string().min(1).max(50).optional(),
  device_id: z.string().uuid()
})

export async function POST(request: Request) {
  const body = await request.json()
  const result = CreateSessionSchema.safeParse(body)

  if (!result.success) {
    return Response.json({ error: result.error }, { status: 400 })
  }

  // Now safe to use result.data
}
```

---

## 🔒 Critical Patterns

**8 battle-tested patterns from building this project.**

### Quick Reference

**Real-Time Sync:**
1. **tldraw Store Listener Pattern** - Listen to editor changes, broadcast records, apply remote changes
2. **Broadcast Channel Pattern** - Use Supabase Realtime, throttle at 60Hz, batch updates
3. **Late Joiner Sync** - Store canvas snapshot in database, load on session join

**Database & Security:**
4. **RLS Anonymous Access** - Use device_id with RLS policies, no authentication required
5. **Session Code Generation** - Memorable codes (adjective-animal), check uniqueness before insert
6. **Migration Schema Reload** - Always end migrations with `NOTIFY pgrst, 'reload schema';`

**Error Handling:**
7. **Supabase Errors Are Misleading** - Verify with queries, don't trust error messages alone
8. **Cleanup in useEffect** - Always return cleanup function (unsubscribe, clear timers)

---

### Pattern 1: tldraw Store Listener

**Problem:** Need to broadcast canvas changes to other participants in real-time.

**Solution:**
```typescript
// components/WhiteboardCanvas.tsx
useEffect(() => {
  if (!editor) return;

  // Listen to all store changes
  const unsubscribe = editor.store.listen((entry) => {
    // Extract changed records
    const changes = Object.values(entry.changes.added).concat(
      Object.values(entry.changes.updated)
    );

    if (changes.length === 0) return;

    // Broadcast to other participants
    broadcast({
      type: 'canvas_changes',
      payload: { records: changes }
    });
  });

  return unsubscribe; // CRITICAL: Cleanup on unmount
}, [editor, broadcast]);
```

**Why This Works:**
- tldraw's store is CRDT-based (automatic conflict resolution)
- Changes are already serializable and minimal
- Other participants apply changes with `editor.store.put(records)`
- No custom merge logic needed

**Gotchas:**
- Must throttle broadcasts to avoid flooding (tldraw does this internally at 60Hz)
- Must filter out remote changes to avoid infinite loops (tldraw handles this)
- Cleanup is critical (memory leaks if unsubscribe not called)

---

### Pattern 2: Broadcast Channel Pattern

**Problem:** Multiple participants need to send/receive canvas changes without conflicts.

**Solution:**
```typescript
// hooks/useBroadcastChannel.ts
export function useBroadcastChannel(sessionCode: string) {
  const channel = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Subscribe to Supabase Realtime channel
    channel.current = supabase.channel(`session:${sessionCode}`)
      .on('broadcast', { event: 'canvas_changes' }, (payload) => {
        // Apply changes from other participants
        onMessage(payload);
      })
      .subscribe();

    return () => {
      channel.current?.unsubscribe();
    };
  }, [sessionCode]);

  const broadcast = useCallback((message: BroadcastMessage) => {
    channel.current?.send({
      type: 'broadcast',
      event: 'canvas_changes',
      payload: message
    });
  }, []);

  return { broadcast };
}
```

**Why This Works:**
- Supabase Realtime uses WebSockets (low latency)
- Broadcast doesn't go through database (fast, no storage cost)
- Channel scoped to session (automatic isolation)

**Performance:**
- ~50-100ms latency (acceptable for drawing)
- Handles 10+ concurrent users easily
- No database writes (just ephemeral broadcast)

**Gotchas:**
- Must unsubscribe on cleanup (memory leaks)
- Broadcast is fire-and-forget (no delivery guarantee)
- Late joiners miss previous broadcasts (need snapshot sync)

---

### Pattern 3: Late Joiner Sync

**Problem:** User joins session after drawing has started. Canvas is blank.

**Solution:**
```typescript
// On canvas change (from any user)
const saveSnapshot = debounce(async () => {
  const snapshot = editor.store.getSnapshot();

  await supabase
    .from('sessions')
    .update({ canvas_snapshot: snapshot })
    .eq('code', sessionCode);
}, 5000); // Save every 5 seconds

// On session join (new user)
useEffect(() => {
  const loadSnapshot = async () => {
    const { data } = await supabase
      .from('sessions')
      .select('canvas_snapshot')
      .eq('code', sessionCode)
      .single();

    if (data?.canvas_snapshot) {
      editor.store.loadSnapshot(data.canvas_snapshot);
    }
  };

  loadSnapshot();
}, [sessionCode]);
```

**Why This Works:**
- Snapshot is full canvas state (all shapes, styles, layers)
- Stored as JSONB in database (efficient)
- Loaded before subscribing to broadcasts (no race condition)

**Trade-offs:**
- Database writes every 5 seconds (small cost)
- Snapshot size grows with canvas complexity (~10-100 KB typical)
- Alternative: Store changes in database (more complex, higher cost)

---

### Pattern 4: RLS Anonymous Access

**Problem:** Users are anonymous (no accounts), but need secure access to their session data.

**Solution:**
```sql
-- supabase/migrations/002_rls_policies.sql

-- Allow anyone to read active sessions by code
CREATE POLICY "Anyone can read sessions by code"
ON sessions FOR SELECT
USING (status = 'active');

-- Allow anyone to create sessions
CREATE POLICY "Anyone can create sessions"
ON sessions FOR INSERT
WITH CHECK (true);

-- Allow participants to read their session
CREATE POLICY "Participants can read their session"
ON participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = participants.session_id
    AND sessions.status = 'active'
  )
);

-- Allow anyone to join as participant
CREATE POLICY "Anyone can join as participant"
ON participants FOR INSERT
WITH CHECK (true);
```

**Why This Works:**
- No authentication required (anonymous users)
- Session code acts as shared secret (528 possible codes = hard to guess)
- RLS ensures users only see active sessions
- Device ID tracks participants without accounts

**Security Considerations:**
- Session codes are not cryptographically secure (not for sensitive data)
- Anyone with code can join (by design)
- Future: Add optional passwords for private sessions

---

### Pattern 5: Session Code Generation

**Problem:** Need memorable codes that are unique and easy to share verbally.

**Solution:**
```typescript
// utils/sessionCode.ts
const adjectives = ['happy', 'bright', 'cool', 'fast', ...]; // 24 total
const animals = ['tiger', 'eagle', 'wolf', 'fox', ...]; // 22 total

export function generateSessionCode(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  return `${adjective}-${animal}`;
}

// In useCreateSession.ts
const createSession = async () => {
  let code = generateSessionCode();
  let attempts = 0;

  // Retry if code already exists (rare)
  while (attempts < 5) {
    const { data, error } = await supabase
      .from('sessions')
      .insert({ code, status: 'active' })
      .select()
      .single();

    if (!error) return data;
    if (error.code !== '23505') throw error; // Not a unique violation

    code = generateSessionCode();
    attempts++;
  }

  throw new Error('Failed to generate unique session code');
};
```

**Why This Works:**
- 528 possible combinations (24 × 22)
- Easy to remember and say verbally ("happy-tiger")
- Collision rate is low (0.2% at 100 active sessions)
- Retry logic handles rare collisions

**Trade-offs:**
- Not suitable for 1000+ concurrent sessions (collision rate increases)
- Future: Add timestamp-based codes for scalability

---

### Pattern 6: Migration Schema Reload

**Problem:** Supabase PostgREST caches schema. New tables/columns not accessible after migration.

**Solution:**
```sql
-- supabase/migrations/001_initial_schema.sql

-- ... table definitions ...

-- CRITICAL: Reload schema cache
NOTIFY pgrst, 'reload schema';
```

**Why This Matters:**
- Without `NOTIFY`, need to restart Supabase (or wait for auto-reload)
- Applies to: New tables, columns, RLS policies, functions
- Must be at end of migration file

**Gotchas:**
- Only works for PostgreSQL notifications (not SQLite, MySQL)
- Some clients cache schema separately (restart app if needed)

---

### Pattern 7: Supabase Errors Are Misleading

**Problem:** Supabase returns generic errors that don't reveal the root cause.

**Example:**
```typescript
// Error: "Failed to create session"
// Actual cause: RLS policy blocks INSERT

// Always verify with direct query
const { data, error } = await supabase
  .from('sessions')
  .insert({ code: 'happy-tiger', status: 'active' })
  .select()
  .single();

console.error(error); // "new row violates row-level security policy"

// Check RLS policies in Supabase dashboard
// Fix: Add "Anyone can create sessions" policy
```

**Debugging Steps:**
1. Check Supabase dashboard > Database > Table > RLS policies
2. Test query in SQL Editor (bypasses RLS for testing)
3. Check PostgreSQL logs for detailed error
4. Verify `.env.local` has correct anon key (not service key)

---

### Pattern 8: Cleanup in useEffect

**Problem:** Real-time subscriptions and timers persist after component unmount (memory leaks).

**Solution:**
```typescript
// GOOD: Always return cleanup function
useEffect(() => {
  const channel = supabase.channel('session:happy-tiger')
    .on('broadcast', { event: 'canvas_changes' }, handleMessage)
    .subscribe();

  return () => {
    channel.unsubscribe(); // CRITICAL
  };
}, []);

// BAD: No cleanup
useEffect(() => {
  const channel = supabase.channel('session:happy-tiger')
    .on('broadcast', { event: 'canvas_changes' }, handleMessage)
    .subscribe();

  // Missing cleanup = memory leak
}, []);
```

**Common Cleanup Patterns:**
- Supabase channels: `channel.unsubscribe()`
- tldraw listeners: `unsubscribe()` (returned from `editor.store.listen()`)
- Timers: `clearInterval(timer)`, `clearTimeout(timer)`
- Event listeners: `element.removeEventListener()`

**React 18 StrictMode:**
- Runs effects twice in development (tests cleanup logic)
- If you see double subscriptions, check cleanup function

---

## 🔄 Karpathy-Inspired AI Collaboration Principles

### **1. Don't Assume - Seek Clarification**

**Problem:** AI often makes assumptions silently and runs with them.

**Solution:** Force explicit confirmation on ambiguous requirements.

```typescript
// ❌ BAD: Claude assumes implementation
"Add a participant list"

// ✅ GOOD: Explicit requirements
"Add a participant list with these specs:
- Show all active participants in current session
- Display nickname (or 'Anonymous' if not set)
- Show connection status (green dot = online)
- Real-time updates when participants join/leave
- Storage: participants table in Supabase
Should I proceed with this design?"
```

**Prompt template for Claude:**
```
Before implementing [feature], confirm:
1. What data structure should I use?
2. Where should state live (client/server)?
3. What are the edge cases I should handle?
4. Are there any existing patterns in the codebase I should follow?
```

---

### **2. Surface Tradeoffs - No Silent Choices**

**Problem:** AI picks an approach without explaining alternatives.

**Solution:** Ask Claude to present options with pros/cons.

```typescript
// ❌ BAD: Claude just implements
"Add real-time canvas sync"

// ✅ GOOD: Request tradeoff analysis
"Add real-time canvas sync. Present 3 approaches:
1. Supabase Realtime (pros/cons)
2. Socket.io (pros/cons)
3. WebRTC (pros/cons)
Recommend one based on our requirements (30 concurrent users, <100ms latency)"
```

**Example output:**
```
Option 1: Supabase Realtime
✅ Pros: Built-in, no extra server, automatic reconnection
❌ Cons: Potential latency with 30+ subscribers, rate limits

Option 2: Socket.io
✅ Pros: Low latency, full control, scales well
❌ Cons: Need to deploy separate server, more complexity

Option 3: WebRTC
✅ Pros: Peer-to-peer, lowest latency possible
❌ Cons: Complex signaling, doesn't work behind firewalls

Recommendation: Start with Supabase Realtime (Option 1) for MVP.
If we hit performance issues, migrate to Socket.io in Phase 2.
```

---

### **3. Goal-Driven Execution - Outcomes, Not Steps**

**Problem:** Telling AI "how" constrains its problem-solving.

**Solution:** Define success criteria and let AI figure out "how".

```typescript
// ❌ BAD: Imperative instructions
"Create a function that loops through participants, filters by online status,
 maps to their nicknames, then returns an array"

// ✅ GOOD: Declarative goal with verification
"Write a function that returns nicknames of online participants.
Test it with this data: [...]
Expected output: ['Alice', 'Bob']
Include error handling for empty arrays."
```

**Goal-driven prompting template:**
```
Goal: [What should be achieved]
Success criteria: [How to verify it works]
Constraints: [What to avoid]
Verification: [How Claude should test it]
```

---

### **4. Minimize Scope - Simple Before Complex**

**Problem:** AI over-engineers solutions (1000 lines when 100 would do).

**Solution:** Explicitly request minimal implementation first.

```typescript
// ❌ BAD: Open-ended request
"Build a participant management system"

// ✅ GOOD: Minimal scope with expansion path
"Build a minimal participant list with ONLY:
- Display nicknames of all participants
- Show connection status (green/yellow dot)
- Real-time updates when someone joins/leaves

No animations, no settings, no historical data.
We'll add features incrementally after testing.

Keep the component under 150 lines."
```

**Scope control phrases:**
- "Simplest possible implementation"
- "MVP version only"
- "No abstractions yet"
- "If it requires >200 lines, we're over-engineering"

---

## 🤖 Working with Claude Code

### **Session Management:**

**Start complex features with Plan Mode:**
```bash
# Shift+Tab twice to enter Plan mode
> I need to add participant presence tracking. Can you create a plan?

Claude generates plan...

# Review plan, refine until solid
> Looks good, but use Supabase Presence instead of manual tracking

Claude updates plan...

# Switch to implementation
> Implement this plan

Claude executes without further input
```

**Use custom skills:**
```bash
# Create a session summary
/session-summary participant-presence

# Get Next.js guidance
/nextjs-app-router

# Get Supabase help
/supabase-postgres
```

---

## 🔄 Complete Development Workflow

### **The 5-Phase System**

This project uses a systematic workflow with 6 custom skills and automation scripts. Every feature follows the same path for consistent quality:

```
Design → Decompose → Execute → Verify → Document → Ship
```

**Quick start for new features:**
```bash
# 1. Initialize workflow
npm run feature start "feature name"

# 2. Design phase
/structured-design-thinking "feature name"

# 3. Move to next phase
npm run feature next

# 4. Decomposition phase
/task-decomposition "feature name"

# 5. Move to execution
npm run feature next

# 6. Execute systematically
/systematic-execution "feature name"
# For each task: Write code → /self-verification → Present

# 7. Run automated checks
npm run feature verify

# 8. Full verification
npm run feature next
/pre-ship-review "feature name"

# 9. Document learnings
npm run feature next
/session-summary "feature name"

# 10. Finish
npm run feature finish
```

### **The 6 Skills**

**1. `/structured-design-thinking` - Design Phase (15-30 min)**
- Analyzes codebase patterns
- Creates design doc with success criteria
- Documents architectural decisions
- Output: `docs/plans/<feature>-design.md`

**2. `/task-decomposition` - Decompose Phase (10-15 min)**
- Breaks feature into 2-5 minute tasks
- Orders by dependencies
- Includes verification steps
- Output: Task list (not a file)

**3. `/systematic-execution` - Execute Phase (1-6 hours)**
- One task at a time
- Uses `/self-verification` per task
- Tracks progress
- Maintains focus

**4. `/self-verification` - During Execution (per task)**
- **Code-level verification (MICRO)**
- 6 layers: Syntax, tests, build, manual, edge cases, security
- Used AFTER writing each code snippet
- Catches 95% of bugs before user sees them

**5. `/pre-ship-review` - Verify Phase (30-90 min)**
- **Feature-level verification (MACRO)**
- 8 layers: Integration, patterns, security, performance, build, testing, accessibility, deployment
- Used AFTER all tasks complete
- Must pass ALL layers to ship

**6. `/session-summary` - Document Phase (15-30 min)**
- Creates session summary
- Documents decisions and learnings
- Updates project docs
- Output: `docs/session-summaries/<date>-<feature>.md`

### **Two-Level Verification**

```
┌─────────────────────────────────────────┐
│ During Execution (MICRO)                │
│ Write code → /self-verification         │
│ ✅ Verifies: Code snippets work         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ After All Tasks (MACRO)                 │
│ All tasks done → /pre-ship-review       │
│ ✅ Verifies: Feature integration works  │
└─────────────────────────────────────────┘
```

### **Automation Commands**

```bash
# Workflow management
npm run feature start "name"    # Start new feature
npm run feature next            # Move to next phase
npm run feature status          # Show current state
npm run feature verify          # Run automated checks
npm run feature finish          # Mark complete
npm run feature reset           # Reset state

# Quick verification
npm run verify                  # Same as feature verify
```

### **State Tracking**

Workflow state stored in `.workflow/` directory (gitignored):
- `current-feature.txt` - Feature name
- `current-phase.txt` - Current phase (design/decompose/execute/verify/document)
- `started-at.txt` - Start timestamp

On finish, state archived to `.workflow/archive/`.

### **Complete Documentation**

See **docs/WORKFLOWS.md** for:
- Detailed phase-by-phase guide
- Real-world examples (with timelines)
- Troubleshooting common issues
- Best practices
- Success metrics

**Time investment:**
- Setup: Already done! ✅
- Per feature overhead: 15-30 minutes
- Time savings: 5-9 hours per feature (prevents rework, catches bugs early)
- Break-even: After 2-3 features

---

## 📋 Pre-Flight Checklist

### **Before committing code, verify:**
- [ ] TypeScript compiles without errors (`npm run type-check`)
- [ ] Tests pass (`npm run test`)
- [ ] No console.log statements (use proper logging)
- [ ] No commented-out code (delete it, Git remembers)
- [ ] Environment variables not hardcoded
- [ ] Mobile responsive (test on real device if possible)
- [ ] Supabase RLS policies tested (try accessing data as different users)

### **Before deploying to production:**
- [ ] Database migrations tested on staging
- [ ] Error boundaries implemented
- [ ] Load testing completed (simulate 30 concurrent users)
- [ ] Mobile testing on real devices
- [ ] Rate limiting configured
- [ ] Monitoring configured (Vercel analytics)

---

## 📚 Resources & References

### **Documentation:**
- [Next.js App Router](https://nextjs.org/docs/app)
- [TLDraw SDK](https://tldraw.dev/docs)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)

### **Key Design Decisions:**
1. **Why tldraw over custom canvas?** Faster MVP, professional features built-in, CRDT conflict resolution
2. **Why Supabase over Firebase?** PostgreSQL (relational), better RLS, real-time broadcast
3. **Why Next.js App Router over Pages?** Modern, Server Components reduce client JS
4. **Why anonymous over accounts?** Remove all friction, perfect for study groups

### **Project Documentation:**
- [Quick Start Guide](QUICKSTART.md) - 10-minute setup with troubleshooting
- [Supabase Setup](SUPABASE_SETUP.md) - Database configuration step-by-step
- [Deployment Guide](DEPLOYMENT.md) - Vercel deployment with monitoring
- [Project Summary](PROJECT_SUMMARY.md) - Comprehensive implementation details

---

## 🚢 Deployment & DevOps

### **Environments:**
- **Development:** Local (`localhost:3000`)
- **Staging:** Vercel preview branch (auto-deployed on PR)
- **Production:** Vercel main branch (manual promotion)

### **Deployment checklist:**
```bash
# 1. Run tests
npm run test

# 2. Type check
npm run type-check

# 3. Build production
npm run build

# 4. Deploy (Vercel auto-deploys from GitHub)
git push origin main
```

### **Monitoring:**
- **Errors:** Vercel monitoring (automatic)
- **Uptime:** Vercel monitoring (automatic)
- **Database:** Supabase dashboard (query performance, storage)

---

## ✅ Summary: Key Takeaways

1. **Keep it simple:** 100 lines beats 1000 lines
2. **Verify everything:** AI suggestions need human review
3. **Security first:** RLS, input validation, no exposed secrets
4. **Real-time carefully:** Debounce updates, handle disconnections
5. **Document decisions:** Update this file when you learn something
6. **Test edge cases:** Empty states, max capacity, network failures
7. **Mobile matters:** 50% of users will use phones
8. **Plan before code:** Use Plan Mode for complex features

---

**Last updated:** 2026-02-07
**Version:** 2.0 (Comprehensive development guidelines)
**Next review:** After Phase 2 feature completion

---

## 🤝 Contributing to This File

When you discover a better pattern:
1. Add it to the relevant section
2. Include code example (good vs. bad)
3. Explain WHY this pattern is better
4. Commit with message: "docs: update CLAUDE.md with [pattern]"

This file should grow with the project. If you hesitate to commit something because "it's too small," commit it anyway. Small improvements compound.

---

**Remember:** This tool helps students collaborate on homework, projects, and learning. Every decision we make affects their ability to work together effectively. Code quality = collaboration quality. Take pride in building something that matters.
