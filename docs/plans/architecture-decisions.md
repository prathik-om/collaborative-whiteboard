# Architecture Decision Records (ADRs)

**Purpose:** Document key technical decisions, their context, and rationale so future developers understand why things are the way they are.

**Format:** Each ADR follows a standard template:
- **Status:** Proposed, Accepted, Deprecated, Superseded
- **Context:** What problem are we solving?
- **Decision:** What did we decide?
- **Consequences:** What are the trade-offs?

---

## ADR Index

| # | Title | Status | Date |
|---|-------|--------|------|
| 001 | Use Next.js App Router | Accepted | 2026-02-05 |
| 002 | Use tldraw for Canvas | Accepted | 2026-02-05 |
| 003 | Use Supabase for Backend | Accepted | 2026-02-05 |
| 004 | Anonymous Access Pattern | Accepted | 2026-02-06 |
| 005 | Session Code Format | Accepted | 2026-02-06 |
| 006 | Broadcast vs Database Sync | Accepted | 2026-02-06 |
| 007 | TypeScript Strict Mode | Accepted | 2026-02-07 |
| 008 | Test-Driven Development | Accepted | 2026-02-07 |

---

## ADR-001: Use Next.js App Router

**Status:** Accepted (2026-02-05)

### Context
We need a React framework for the collaborative whiteboard. Options considered:
- **Next.js App Router** (Next.js 13+)
- **Next.js Pages Router** (Next.js 12)
- **Create React App (CRA)**
- **Vite + React**

### Decision
Use **Next.js 15.1.6 with App Router**.

### Rationale
**Pros:**
- Server Components reduce client bundle size (faster initial load)
- File-based routing is intuitive (`app/board/page.tsx`)
- Built-in API routes for future backend needs
- Automatic code splitting and optimization
- Vercel deployment is seamless (one-click)
- Modern architecture (future-proof)

**Cons:**
- App Router is newer (less mature than Pages Router)
- Server vs Client Component mental model requires learning
- Some libraries don't support Server Components yet

**Why not alternatives:**
- **Pages Router:** Older pattern, larger client bundles
- **CRA:** Deprecated, no SSR, slower builds
- **Vite:** No built-in SSR, need custom routing, more setup

### Consequences
- Must understand Server Components vs Client Components
- Can leverage server-side rendering for SEO (if needed)
- Easy to deploy to Vercel (free tier)
- Can add API routes later without separate backend

### References
- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Why App Router?](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)

---

## ADR-002: Use tldraw for Canvas

**Status:** Accepted (2026-02-05)

### Context
We need a collaborative drawing canvas. Options considered:
- **tldraw SDK** (whiteboard library)
- **Fabric.js** (canvas manipulation)
- **Konva.js** (2D canvas framework)
- **Excalidraw** (whiteboard alternative)
- **Custom Canvas API** (from scratch)

### Decision
Use **tldraw 2.4.6** SDK.

### Rationale
**Pros:**
- CRDT-based (automatic conflict resolution for collaboration)
- Professional whiteboard features out-of-box (shapes, text, arrows, etc.)
- Real-time collaboration built-in (just wire up transport)
- Clean API, well-documented
- Free for non-commercial use (our use case)
- Active development, responsive maintainers

**Cons:**
- Commercial license required if we monetize ($500/year)
- Limited customization of internals
- Larger bundle size (~200KB)
- Dependency on external library

**Why not alternatives:**
- **Fabric.js/Konva.js:** No CRDT, we'd build collaboration from scratch
- **Excalidraw:** Great but less flexible API, harder to integrate
- **Custom Canvas:** Months of work, error-prone, not our core value

### Consequences
- Fast MVP (1 week vs 3+ months for custom canvas)
- Must pay license fee if we monetize (acceptable trade-off)
- Limited control over canvas internals (acceptable for MVP)
- Bundle size increases but acceptable (<500KB total)

### Migration Path
If tldraw becomes limiting:
1. Abstract canvas behind interface
2. Implement custom canvas with same interface
3. Gradually migrate features

### References
- [tldraw SDK Docs](https://tldraw.dev/docs)
- [tldraw Licensing](https://tldraw.dev/license)

---

## ADR-003: Use Supabase for Backend

**Status:** Accepted (2026-02-05)

### Context
We need a backend for session management and real-time sync. Options considered:
- **Supabase** (PostgreSQL + Realtime)
- **Firebase** (NoSQL + Realtime Database)
- **AWS Amplify** (managed backend)
- **Custom Node.js + PostgreSQL + Socket.io**

### Decision
Use **Supabase** (PostgreSQL + Realtime).

### Rationale
**Pros:**
- PostgreSQL (relational DB, better for structured data)
- Row-Level Security (RLS) for fine-grained access control
- Realtime subscriptions (WebSocket broadcast)
- TypeScript types auto-generated from schema
- Free tier generous (50,000 monthly active users)
- Europe-based (GDPR friendly)
- Great developer experience

**Cons:**
- Realtime broadcast may have latency with 30+ users (need to test)
- Vendor lock-in (but can self-host PostgreSQL)
- Less mature than Firebase

**Why not alternatives:**
- **Firebase:** NoSQL not ideal for relational data, weaker querying
- **AWS Amplify:** More complex setup, less beginner-friendly
- **Custom backend:** Months of work, infrastructure overhead

### Consequences
- Fast development (no backend code to write)
- RLS policies provide security without auth middleware
- Can self-host if needed (PostgreSQL is open source)
- May need Socket.io if Realtime doesn't scale (plan B)

### Migration Path
If Supabase Realtime doesn't scale:
1. Keep PostgreSQL for data storage
2. Add Socket.io server for real-time sync
3. Migrate broadcast logic to Socket.io

### References
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

## ADR-004: Anonymous Access Pattern

**Status:** Accepted (2026-02-06)

### Context
We need to decide on authentication strategy. Options considered:
- **No authentication** (fully open)
- **Anonymous with device ID** (pseudonymous)
- **Required email/password** (traditional auth)
- **Google OAuth** (social login)

### Decision
Use **anonymous access with device-based identification** (client-generated UUID).

### Rationale
**Pros:**
- Zero friction (no sign-up, no passwords)
- Perfect for students (no email required)
- Fast onboarding (instant collaboration)
- Privacy-friendly (no PII collected)
- COPPA compliant (no data from under 13)

**Cons:**
- No persistent user identity across devices
- No session history (unless we add localStorage)
- Harder to prevent abuse (rate limiting needed)
- Can't recover sessions if device lost

**Why not alternatives:**
- **Email/password:** Too much friction for students
- **Google OAuth:** Requires Google account (not all students have)
- **Fully open:** Too risky (spam, abuse)

### Consequences
- Must implement device fingerprinting for abuse prevention
- Session history requires localStorage (not cross-device)
- Optional accounts can be added later (Phase 3)

### Implementation Details
```typescript
// Generate device ID on first visit
const deviceId = localStorage.getItem('deviceId') || crypto.randomUUID()
localStorage.setItem('deviceId', deviceId)

// Use device ID in RLS policies
CREATE POLICY "Participants can read their session"
ON participants FOR SELECT
USING (device_id = current_setting('app.device_id'))
```

### References
- [CLAUDE.md: RLS Anonymous Access Pattern](../../CLAUDE.md#pattern-4-rls-anonymous-access)

---

## ADR-005: Session Code Format

**Status:** Accepted (2026-02-06)

### Context
We need memorable session codes for sharing. Options considered:
- **Random alphanumeric** (e.g., `A7B3X9`)
- **Adjective-Animal** (e.g., `happy-tiger`)
- **Numeric PIN** (e.g., `123456`)
- **Words from dictionary** (e.g., `correct-horse-battery-staple`)

### Decision
Use **adjective-animal format** (e.g., `happy-tiger`).

### Rationale
**Pros:**
- Easy to remember (mnemonic)
- Easy to say verbally ("Join happy-tiger")
- Pleasant UX (fun, friendly)
- 528 unique combinations (24 adjectives × 22 animals)
- URL-safe (no special characters)

**Cons:**
- Not cryptographically secure (predictable)
- Limited scale (528 codes, collision risk at ~100 concurrent sessions)
- Inappropriate words possible (must curate lists)

**Why not alternatives:**
- **Alphanumeric:** Hard to remember, not verbal-friendly
- **Numeric PIN:** Easy to guess, feels impersonal
- **Dictionary words:** Too long, harder to type

### Consequences
- Must retry on collision (rare but possible)
- Not suitable for 1000+ concurrent sessions (Phase 3: add timestamps)
- Must curate adjective/animal lists (no offensive words)

### Implementation Details
```typescript
const adjectives = ['happy', 'bright', 'cool', 'fast', ...] // 24 total
const animals = ['tiger', 'eagle', 'wolf', 'fox', ...] // 22 total

// Collision rate: ~0.2% at 100 concurrent sessions
// Formula: P(collision) = 1 - (1 - 1/528)^n where n = active sessions
```

### Migration Path (Phase 3)
If scale requires more codes:
- Add timestamp suffix: `happy-tiger-2026` (528 × 365 = 192,720 daily codes)
- Or numeric suffix: `happy-tiger-1`, `happy-tiger-2`

### References
- [Birthday Problem](https://en.wikipedia.org/wiki/Birthday_problem) (collision probability)

---

## ADR-006: Broadcast vs Database Sync

**Status:** Accepted (2026-02-06)

### Context
We need to sync canvas changes in real-time. Options considered:
- **Supabase Realtime Broadcast** (ephemeral WebSocket)
- **Database polling** (query every N seconds)
- **Database triggers + Realtime** (persistent changes)
- **WebRTC** (peer-to-peer)

### Decision
Use **Supabase Realtime Broadcast** for canvas changes, with **periodic database snapshots** for late-joiner recovery.

### Rationale
**Pros:**
- Low latency (~50-100ms)
- No database writes (fast, no storage cost)
- Ephemeral (privacy-friendly, data auto-deleted)
- Scales to 30+ concurrent users
- Simple implementation

**Cons:**
- Fire-and-forget (no delivery guarantee)
- Late joiners miss previous changes (need snapshot sync)
- Not persisted (session ends → data gone)

**Why not alternatives:**
- **Database polling:** High latency (>1s), wasteful queries
- **Database triggers:** Every stroke writes to DB (expensive, slow)
- **WebRTC:** Complex signaling, firewall issues

### Implementation Strategy
```typescript
// Real-time changes: Broadcast (ephemeral)
broadcast({
  type: 'canvas_changes',
  payload: { records: changes }
})

// Snapshot sync: Database (persistent)
debounce(() => {
  supabase.from('sessions')
    .update({ canvas_snapshot: editor.store.getSnapshot() })
    .eq('code', sessionCode)
}, 5000) // Save every 5 seconds
```

### Consequences
- Fast real-time updates (good UX)
- Late joiners need snapshot (5-second delay acceptable)
- Database writes minimal (~12 per minute per session)
- Data ephemeral (acceptable for study groups)

### Migration Path
If broadcast doesn't scale:
1. Deploy Socket.io server
2. Replace Supabase Realtime with Socket.io
3. Keep database snapshot sync

### References
- [Supabase Realtime Broadcast](https://supabase.com/docs/guides/realtime/broadcast)

---

## ADR-007: TypeScript Strict Mode

**Status:** Accepted (2026-02-07)

### Context
We need to decide TypeScript configuration. Options considered:
- **Strict mode** (`strict: true`)
- **Loose mode** (default TypeScript)
- **No TypeScript** (plain JavaScript)

### Decision
Use **TypeScript strict mode** (`strict: true`).

### Rationale
**Pros:**
- Catches bugs at compile time (before runtime)
- Better IDE autocomplete and refactoring
- Self-documenting (types explain function signatures)
- Prevents `null`/`undefined` errors (biggest JS issue)
- Forces better code design

**Cons:**
- Steeper learning curve for beginners
- Slower development initially (type annotations)
- Some libraries have poor TypeScript support

**Why not alternatives:**
- **Loose mode:** Defeats purpose of TypeScript (too permissive)
- **No TypeScript:** Too risky for production (runtime errors)

### Consequences
- 0 TypeScript errors enforced (CI blocks PRs with errors)
- Must define interfaces for all props, API responses
- No `any` types allowed (use `unknown` instead)
- Longer initial development but faster debugging

### Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### References
- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)

---

## ADR-008: Test-Driven Development (TDD)

**Status:** Accepted (2026-02-07)

### Context
We need a testing strategy. Options considered:
- **Test-Driven Development** (write tests first)
- **Test-After Development** (write tests after code)
- **No automated tests** (manual testing only)

### Decision
Adopt **Test-Driven Development (TDD)** for all new features starting Phase 2.

### Rationale
**Pros:**
- Forces thinking about API design before implementation
- Ensures all code is testable
- Prevents over-engineering (write minimal code to pass test)
- Documents expected behavior (tests = living documentation)
- Confidence in refactoring (tests catch regressions)

**Cons:**
- Slower initial development (write test first)
- Learning curve for TDD workflow
- Can lead to brittle tests if not done right

**Why not alternatives:**
- **Test-After:** Often skipped ("I'll write tests later")
- **No tests:** Too risky for production (no confidence in changes)

### Workflow
```
1. Write failing test (red)
2. Watch it fail
3. Write minimal code to pass (green)
4. Refactor (keep tests green)
5. Repeat
```

### Consequences
- 80%+ test coverage enforced (CI blocks PRs below threshold)
- TDD required for all business logic (hooks, utils)
- UI components can use test-after (harder to TDD)

### References
- [Testing Strategy](testing-strategy.md)
- [Kent Beck: TDD by Example](https://www.amazon.com/Test-Driven-Development-Kent-Beck/dp/0321146530)

---

## Future ADRs (To Be Written)

### Proposed Decisions
- **ADR-009:** Rate Limiting Strategy (Redis vs in-memory)
- **ADR-010:** Error Monitoring Tool (Sentry vs Vercel Analytics)
- **ADR-011:** Mobile Strategy (PWA vs Native Apps)
- **ADR-012:** Monetization Model (Premium vs Donations vs Grants)
- **ADR-013:** Analytics Tool (PostHog vs Plausible vs None)

---

## How to Write an ADR

### Template
```markdown
## ADR-XXX: [Title]

**Status:** Proposed | Accepted | Deprecated | Superseded

### Context
What problem are we solving? What options did we consider?

### Decision
What did we decide?

### Rationale
Why did we choose this option?

**Pros:**
- [Benefit 1]
- [Benefit 2]

**Cons:**
- [Drawback 1]
- [Drawback 2]

**Why not alternatives:**
- [Alternative 1]: [Reason it wasn't chosen]
- [Alternative 2]: [Reason it wasn't chosen]

### Consequences
What are the trade-offs? What do we commit to?

### Migration Path (if applicable)
How can we change this decision later if needed?

### References
- [Link to docs]
- [Link to related issues]
```

### When to Write an ADR
- Before making a significant architectural decision
- When choosing between multiple viable options
- When the decision affects multiple parts of the system
- When the decision is hard to reverse later

### When NOT to Write an ADR
- Trivial decisions (e.g., naming a variable)
- Obvious choices (e.g., use React for React project)
- Easily reversible decisions (e.g., button color)

---

## Related Documents

- [Product Roadmap](product-roadmap.md) - Overall vision
- [CLAUDE.md](../../CLAUDE.md) - Development guidelines
- [Testing Strategy](testing-strategy.md) - How to test

---

**Next Steps:**
1. Review ADRs with team (if applicable)
2. Update ADRs when decisions change
3. Write new ADRs before making major decisions
4. Keep ADRs in sync with actual implementation
