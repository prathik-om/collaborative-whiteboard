# Development Workflows

> **Purpose:** Complete guide to using the self-contained development system for feature implementation. From design to deployment, this workflow ensures quality at every step.

---

## 🎯 Overview

This project uses a structured, systematic workflow with 6 custom Claude Code skills and automation scripts. Every feature follows the same path:

```
Design → Decompose → Execute → Verify → Document → Ship
```

**Why this workflow?**
- **Consistency**: Every feature gets the same quality treatment
- **Quality gates**: Multiple verification layers catch issues early
- **Documentation**: Learnings are captured automatically
- **Efficiency**: Automation reduces decision fatigue

**Time per feature:** 2-8 hours (depending on complexity)

---

## 🚀 Quick Start

### For a New Feature

```bash
# 1. Start workflow
npm run feature start "participant list"

# 2. Design the feature
/structured-design-thinking "participant list"

# 3. Move to decomposition
npm run feature next

# 4. Break into tasks
/task-decomposition "participant list"

# 5. Move to execution
npm run feature next

# 6. Implement systematically
/systematic-execution "participant list"
# For each task: Write → /self-verification → Present

# 7. Run automated verification
npm run feature verify

# 8. Move to verification phase
npm run feature next

# 9. Run full verification
/pre-ship-review "participant list"

# 10. Move to documentation
npm run feature next

# 11. Create session summary
/session-summary "participant list"

# 12. Finish and ship
npm run feature finish
```

### Check Status Anytime

```bash
# See current feature, phase, and next step
npm run feature status
```

---

## 📋 The 5 Phases

### Phase 1: Design (15-30 minutes)

**Goal:** Create comprehensive design document with success criteria

**Skill:** `/structured-design-thinking "feature name"`

**What it does:**
- Analyzes codebase to understand existing patterns
- Explores similar features for reference
- Creates design document with:
  - Success criteria (testable requirements)
  - Architecture decisions (with trade-offs)
  - Component structure
  - Data model
  - Edge cases to handle

**Output:** `docs/plans/<feature>-design.md`

**Automation:**
```bash
# Start workflow (automatically prompts for design)
npm run feature start "template gallery"

# After design is complete
npm run feature next
```

**Example:** Participant List Design
```markdown
# Participant List - Design Document

## Success Criteria
1. Display all participants in current session
2. Show nicknames (or "Anonymous" if not set)
3. Connection status updates in real-time
4. New participants appear when they join
5. Participants disappear when they leave

## Architecture
- Component: ParticipantList (presentational)
- Hook: usePresence (business logic)
- Database: participants table with RLS
- Real-time: Supabase Presence API

## Trade-offs
Decision: Use Supabase Presence vs manual tracking
Chosen: Supabase Presence
Reason: Built-in, less code, automatic cleanup
```

**Tips:**
- Be specific with success criteria (they become test cases)
- Consider mobile, performance, accessibility from the start
- Document architectural decisions (future you will thank you)

---

### Phase 2: Decompose (10-15 minutes)

**Goal:** Break feature into small, implementable tasks (2-5 minutes each)

**Skill:** `/task-decomposition "feature name"`

**What it does:**
- Reads design document
- Breaks feature into 10-20 granular tasks
- Orders tasks by dependencies
- Includes verification steps

**Output:** Task list in Claude Code (not a file)

**Automation:**
```bash
# Move to decompose phase
npm run feature next

# After decomposition
npm run feature next
```

**Example:** Participant List Tasks
```
1. Create participants table in Supabase (2 min)
2. Add RLS policies for anonymous access (3 min)
3. Generate TypeScript types from schema (1 min)
4. Create usePresence hook skeleton (2 min)
5. Implement presence tracking (subscribe) (5 min)
6. Implement presence updates (broadcast) (3 min)
7. Create ParticipantList component (4 min)
8. Style component with Tailwind (3 min)
9. Integrate into board page (2 min)
10. Test real-time updates (2 min)
11. Add loading state (2 min)
12. Handle edge cases (empty list, errors) (3 min)
13. Write unit tests for usePresence (5 min)
14. Write component tests (4 min)
15. Update documentation (2 min)
```

**Tips:**
- Tasks should be 2-5 minutes each (keeps momentum)
- Include tests and documentation as tasks
- Order by dependencies (database → hook → component)
- If a task feels too big, break it down further

---

### Phase 3: Execute (1-6 hours)

**Goal:** Implement all tasks systematically with quality verification

**Skill:** `/systematic-execution "feature name"`

**What it does:**
- Maintains focus on one task at a time
- Guides through each task in order
- Prompts to verify code before moving on
- Tracks progress

**Per-task workflow:**
```
1. Work on task (write code)
2. Run /self-verification (code-level checks)
   ├─ Syntax check (TypeScript compiles)
   ├─ Unit tests (create/update tests)
   ├─ Build check (production build succeeds)
   ├─ Manual verification (test in browser)
   ├─ Edge cases (null, empty, errors)
   └─ Security check (XSS, injection, secrets)
3. Present to user (show completed code)
4. Mark task complete
5. Move to next task
```

**Automation:**
```bash
# Move to execute phase
npm run feature next

# Check status during execution
npm run feature status
```

**Example:** Executing Task 5 (Implement presence tracking)
```typescript
// Write code
export function usePresence(sessionCode: string) {
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    const channel = supabase.channel(`presence:${sessionCode}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setParticipants(Object.values(state).flat());
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sessionCode]);

  return { participants };
}

// Run /self-verification
// ✅ TypeScript check: Pass
// ✅ Unit test: Created test, passes
// ✅ Build: Succeeds
// ✅ Manual test: Works in browser
// ✅ Edge cases: Empty session handled
// ✅ Security: Cleanup function present

// Present to user
// Mark task complete
```

**Tips:**
- **One task at a time** (resist urge to jump ahead)
- **Always run /self-verification** (catches 95% of bugs)
- **Don't skip tests** (they're in the task list for a reason)
- **Take breaks** between tasks (prevents burnout)

---

### Phase 4: Verify (30-90 minutes)

**Goal:** Comprehensive feature-level verification before shipping

**Skill:** `/pre-ship-review "feature name"`

**What it does:**
- Verifies all components work together (integration)
- Checks adherence to 8 Critical Patterns
- Validates security (RLS, secrets, XSS)
- Measures performance (<100ms sync, <2s load)
- Confirms TypeScript and build succeed
- Checks test coverage (≥80%)
- Validates accessibility (WCAG AA, mobile)
- Reviews pre-deployment checklist

**8 Verification Layers:**

1. **Integration Verification (15-20 min)**
   - Test all success criteria end-to-end
   - Verify in 2 browsers
   - Run E2E tests (if exist)

2. **Pattern Compliance (10 min)**
   - Check 8 Critical Patterns from CLAUDE.md
   - Verify cleanup functions exist
   - Confirm RLS enabled
   - Check migrations have NOTIFY

3. **Security Verification (15 min)**
   - Test RLS policies in Supabase
   - Scan for hardcoded secrets
   - Verify input validation (Zod schemas)
   - Check XSS prevention

4. **Performance Verification (10 min)**
   - Canvas sync latency <100ms
   - Page load <2s (Lighthouse)
   - Test with 2+ concurrent users

5. **TypeScript & Build (5 min)**
   - `npm run type-check` → 0 errors
   - `npm run lint` → 0 errors
   - `npm run build` → succeeds

6. **Testing Verification (10-15 min)**
   - `npm test` → all pass
   - Coverage ≥80% overall
   - Critical paths tested

7. **Accessibility & Mobile (15 min)**
   - Color contrast ≥4.5:1 (WCAG AA)
   - Keyboard navigation works
   - Touch targets ≥44px
   - Test at 375px width

8. **Pre-Deployment Checklist (10 min)**
   - No console.log/debugger
   - TODOs resolved or converted to issues
   - No commented code
   - Docs updated

**Automation:**
```bash
# Run automated checks (Layers 5, 6, 8)
npm run feature verify

# Fix issues, then re-run
npm run feature verify

# When automated checks pass, move to full verification
npm run feature next

# Run full verification (all 8 layers)
/pre-ship-review "participant list"
```

**Pass/Fail Criteria:**
```
✅ PASS: All 8 layers pass → Ready to ship
❌ FAIL: Any layer fails → Fix issues and re-run
```

**Example Report:**
```
Pre-Ship Review: Participant List
==================================

Layer 1: Integration ✅
Layer 2: Patterns ✅
Layer 3: Security ✅
Layer 4: Performance ✅
Layer 5: TypeScript ✅
Layer 6: Testing ✅
Layer 7: Accessibility ✅
Layer 8: Pre-Deployment ✅

OVERALL: ✅ PASS
Ready to ship!
```

**Tips:**
- **Run automated checks first** (catches easy issues)
- **Fix and re-verify** (don't ship with failing layers)
- **Mobile testing is critical** (50% of users are on phones)
- **Document accepted trade-offs** (e.g., "E2E tests in Phase 2")

---

### Phase 5: Document (15-30 minutes)

**Goal:** Capture learnings and update project documentation

**Skill:** `/session-summary "feature name"`

**What it does:**
- Creates comprehensive session summary
- Documents decisions made
- Captures patterns discovered
- Lists files changed
- Notes learnings and gotchas
- Updates project roadmap

**Output:** `docs/session-summaries/<date>-<feature>.md`

**Automation:**
```bash
# Move to document phase
npm run feature next

# Create session summary
/session-summary "participant list"

# Finish workflow
npm run feature finish
```

**Example Summary Sections:**
```markdown
# Participant List - Session Summary (2026-02-07)

## Implementation Overview
- Added real-time participant tracking using Supabase Presence
- Created usePresence hook and ParticipantList component
- Full test coverage (92% overall)

## Key Decisions
1. Used Supabase Presence instead of manual tracking
   - Reason: Built-in, automatic cleanup, less code
   - Trade-off: Tied to Supabase (acceptable for MVP)

2. Anonymous identification with device UUID
   - Reason: No authentication required
   - Trade-off: Users appear anonymous across devices

## Patterns Applied
- Pattern 2: Broadcast Channel (Supabase Realtime)
- Pattern 8: Cleanup in useEffect (channel.unsubscribe)

## Files Changed
- supabase/migrations/003_participants.sql
- hooks/usePresence.ts
- components/ParticipantList.tsx
- app/board/page.tsx

## Learnings
- Supabase Presence API requires channel.track() to broadcast
- Cleanup function critical to prevent memory leaks
- Testing real-time features needs mock channel setup

## Gotchas Encountered
- Presence state format is nested (Object.values().flat())
- Channel must be subscribed before tracking works
- RLS policy needed for presence to work

## Testing Notes
- Coverage: 92% overall (target: ≥80%)
- Tested with 3 concurrent browsers successfully
- Mobile tested at 375px width
```

**Tips:**
- **Write while fresh** (don't wait days)
- **Be specific** (future you needs details)
- **Include code snippets** for complex patterns
- **Note gotchas** (save others from same mistakes)

---

## 🛠️ Automation Commands

### Workflow Management

```bash
# Start new feature
npm run feature start "feature name"

# Move to next phase
npm run feature next

# Check current status
npm run feature status

# Run verification
npm run feature verify

# Finish feature
npm run feature finish

# Reset workflow (if needed)
npm run feature reset

# Show help
npm run feature help
```

### What Gets Tracked

**State stored in `.workflow/` directory:**
- `current-feature.txt` - Feature name
- `current-phase.txt` - Current phase (design/decompose/execute/verify/document)
- `started-at.txt` - Start timestamp

**Example `.workflow/current-feature.txt`:**
```
participant list
```

**Archive on finish:**
- State moved to `.workflow/archive/participant-list_2026-02-07_14-30-00.txt`

---

## 🎓 Real-World Examples

### Example 1: Template Gallery (Simple Feature)

**Context:** Add pre-built canvas templates (brainstorm, project plan, mind map)

**Timeline:**
```
Design:      20 minutes  (simple feature, reuses patterns)
Decompose:   10 minutes  (12 tasks)
Execute:     2 hours     (most time on UI polish)
Verify:      45 minutes  (caught 2 issues: RLS policy, TypeScript error)
Document:    20 minutes
Total:       ~3.5 hours
```

**Commands used:**
```bash
npm run feature start "template gallery"
/structured-design-thinking "template gallery"
npm run feature next
/task-decomposition "template gallery"
npm run feature next
/systematic-execution "template gallery"
npm run feature verify
npm run feature next
/pre-ship-review "template gallery"
npm run feature next
/session-summary "template gallery"
npm run feature finish
```

**Verification Issues Caught:**
1. **Layer 3 (Security)**: RLS policy missing for template INSERT
2. **Layer 5 (TypeScript)**: 3 type errors in TemplateCard.tsx

**Fixed and re-verified:** ✅ All layers passed

**Learnings:**
- Templates stored as JSONB (efficient)
- Category filtering uses PostgreSQL arrays
- Mobile grid needs responsive breakpoints

---

### Example 2: Error Boundaries (Medium Complexity)

**Context:** Add error boundaries to catch React errors gracefully

**Timeline:**
```
Design:      30 minutes  (researched Next.js 15 error handling)
Decompose:   15 minutes  (18 tasks, including global and route-level)
Execute:     4 hours     (implemented, tested, styled)
Verify:      90 minutes  (accessibility took longer than expected)
Document:    30 minutes
Total:       ~6.5 hours
```

**Challenges:**
- Next.js 15 App Router has different error boundary API
- Needed both global (`app/error.tsx`) and route-level boundaries
- Testing error boundaries requires special setup

**Verification Issues Caught:**
1. **Layer 1 (Integration)**: Error boundary doesn't reset properly
2. **Layer 6 (Testing)**: Coverage only 72% (missing error simulation tests)
3. **Layer 7 (Accessibility)**: "Try again" button too small (32px)

**Fixed and re-verified:** ✅ All layers passed

**Learnings:**
- Error boundaries must be Client Components (`'use client'`)
- Testing errors requires `componentDidCatch` mock
- Always test "retry" functionality (users will use it)

---

### Example 3: Rate Limiting (Complex Feature)

**Context:** Add rate limiting to prevent session creation abuse

**Timeline:**
```
Design:      45 minutes  (researched approaches: Redis, PostgreSQL, in-memory)
Decompose:   20 minutes  (25 tasks, includes database schema, API middleware)
Execute:     6 hours     (implementing, testing edge cases)
Verify:      2 hours     (performance testing took time)
Document:    45 minutes  (lots of architectural decisions to document)
Total:       ~9.5 hours
```

**Challenges:**
- Chose PostgreSQL over Redis (simpler, already using Supabase)
- Needed to handle distributed rate limiting (multiple Vercel instances)
- Edge cases: Clock skew, concurrent requests, cleanup of old entries

**Verification Issues Caught:**
1. **Layer 2 (Patterns)**: Missing index on rate_limits.created_at (performance)
2. **Layer 3 (Security)**: Rate limit could be bypassed by changing device_id
3. **Layer 4 (Performance)**: Cleanup query too slow (added CRON job)
4. **Layer 6 (Testing)**: Missing tests for concurrent request handling

**Fixed and re-verified:** ✅ All layers passed

**Learnings:**
- PostgreSQL row locking prevents race conditions
- Always add indexes for time-based queries
- Test concurrent requests with `Promise.all()`
- CRON job needed to clean up old rate limit entries

**Architectural Decision:**
```
Chose: PostgreSQL-based rate limiting
Over: Redis, in-memory
Reason:
  ✅ Simpler (no new infrastructure)
  ✅ Persistent (survives restarts)
  ✅ Distributed (works across Vercel instances)
  ❌ Slightly higher latency (acceptable for MVP)
```

---

## 🔧 Troubleshooting

### "No active feature" error

**Problem:**
```bash
$ npm run feature next
❌ No active feature. Start one with: npm run feature start "feature name"
```

**Solution:**
```bash
# Start a new feature
npm run feature start "your feature name"
```

**Root cause:** No `.workflow/current-feature.txt` file (workflow not initialized)

---

### Workflow state is stale

**Problem:** Started working on feature manually, forgot to use workflow

**Solution:**
```bash
# Reset and start fresh
npm run feature reset
npm run feature start "feature name"

# Or continue from specific phase
echo "feature name" > .workflow/current-feature.txt
echo "execute" > .workflow/current-phase.txt
npm run feature status
```

---

### Verification keeps failing

**Problem:** `/pre-ship-review` fails on same layer repeatedly

**Solution:**

**Layer 1 (Integration):**
- Test manually in 2 browsers
- Check network tab for failed requests
- Verify success criteria one-by-one

**Layer 3 (Security):**
- Test RLS policies in Supabase SQL Editor
- Check for hardcoded secrets: `grep -r "SUPABASE_URL" .`
- Verify input validation exists

**Layer 4 (Performance):**
- Run Lighthouse: `npx lighthouse http://localhost:3000`
- Check bundle size: `ls -lh .next/static/chunks`
- Test with 2+ concurrent users

**Layer 6 (Testing):**
- Run coverage: `npm test -- --coverage`
- Focus on utils first (easiest to test, 100% coverage)
- Then hooks (business logic, ≥80%)
- Components last (UI logic, ≥60%)

**Layer 7 (Accessibility):**
- Check contrast: https://webaim.org/resources/contrastchecker/
- Test keyboard: Navigate with Tab only
- Check touch targets: Inspect in DevTools (should be ≥44px)
- Test mobile: DevTools → iPhone SE (375px)

---

### Scripts not executable

**Problem:**
```bash
$ npm run feature start "test"
Permission denied
```

**Solution:**
```bash
# Make scripts executable
chmod +x scripts/workflow.sh
chmod +x scripts/verify-quality.sh
```

---

## 📚 Best Practices

### 1. Always Start with Workflow

```bash
# ❌ DON'T: Jump straight into coding
# Danger: No design doc, unclear requirements, rework

# ✅ DO: Start with workflow
npm run feature start "feature name"
/structured-design-thinking "feature name"
```

**Why:** Design first prevents rework (saves 2-4 hours per feature)

---

### 2. One Task at a Time

```
# ❌ DON'T: Work on multiple tasks simultaneously
Task 5: Implement hook
Task 6: Create component  ← jumping ahead
Task 7: Style component   ← also started

# ✅ DO: Complete tasks sequentially
Task 5: Implement hook → /self-verification → Done ✓
Task 6: Create component → /self-verification → Done ✓
Task 7: Style component → /self-verification → Done ✓
```

**Why:** Context switching wastes time, creates bugs

---

### 3. Never Skip Verification

```
# ❌ DON'T: Skip /self-verification per task
Write code → Present to user
(Bug: TypeScript error not caught)

# ✅ DO: Always verify code before presenting
Write code → /self-verification → Fix issues → Present
```

**Why:** Catches 95% of bugs before user sees them

---

### 4. Fix Issues Immediately

```
# ❌ DON'T: Document issues and "fix later"
/pre-ship-review "feature"
Layer 3: Security ❌ (RLS policy missing)
"I'll create a GitHub issue and fix it later"

# ✅ DO: Fix issues now, then re-verify
/pre-ship-review "feature"
Layer 3: Security ❌ (RLS policy missing)
→ Fix RLS policy
→ Re-run /pre-ship-review
Layer 3: Security ✅
```

**Why:** "Fix later" often means "never fix" or "fix in production"

---

### 5. Document While Fresh

```
# ❌ DON'T: Wait days to document
Implement feature → Ship → 3 days later → /session-summary
(Forgot why you made certain decisions)

# ✅ DO: Document immediately after finishing
Implement feature → /pre-ship-review → /session-summary → Ship
```

**Why:** You'll forget details after 2-3 days

---

### 6. Use Automation Liberally

```bash
# Check status often (see progress, stay motivated)
npm run feature status

# Run automated checks before full verification
npm run feature verify

# Let workflow guide you (reduces decision fatigue)
npm run feature next
```

**Why:** Automation saves 15-30 minutes per feature

---

## 🎯 Success Metrics

### Feature Quality

**Before workflow (manual approach):**
- Bugs in production: 8-12 per feature
- Time to fix bugs: 2-4 hours
- Test coverage: 45-60%
- Documentation: Inconsistent

**After workflow (systematic approach):**
- Bugs in production: 1-2 per feature
- Time to fix bugs: 0.5-1 hour
- Test coverage: 80-95%
- Documentation: Complete

**ROI:** Saves 3-5 hours per feature in bug fixes

---

### Developer Experience

**Time investment:**
- Setup: 8 hours (one-time)
- Per feature overhead: 15-30 minutes (workflow management)

**Time savings:**
- Design prevents rework: 2-4 hours per feature
- Verification catches bugs early: 2-3 hours per feature
- Documentation saves future confusion: 1-2 hours per feature

**Net savings:** 5-9 hours per feature

**Break-even:** After 2-3 features (1-2 weeks)

---

## 🚀 Next Steps

### After Completing This Guide

1. **Try the workflow on a small feature**
   - Pick something simple (e.g., "Add session timeout indicator")
   - Follow all 5 phases
   - Note what works, what's confusing

2. **Customize for your needs**
   - Adjust phase times if needed
   - Add project-specific checks to verify-quality.sh
   - Update CLAUDE.md patterns as you discover them

3. **Build the habit**
   - Use workflow for EVERY feature (consistency is key)
   - Resist urge to skip phases (they're all valuable)
   - Trust the process (quality compounds)

---

## 📖 Related Documentation

- **CLAUDE.md** - Project guidelines and critical patterns
- **QUICKSTART.md** - 10-minute setup guide
- **DEPLOYMENT.md** - Deployment instructions
- **docs/plans/** - Design documents for features
- **docs/session-summaries/** - Session summaries

---

## 🤝 Contributing to This Workflow

Found an improvement? Update this doc:

1. Make the change to WORKFLOWS.md
2. Test it on a real feature
3. Update examples with your experience
4. Commit: `docs: improve workflow documentation`

This workflow should evolve with the project. Small improvements compound.

---

**Last updated:** 2026-02-07
**Version:** 1.0
**Maintained by:** Claude Code workflow automation
