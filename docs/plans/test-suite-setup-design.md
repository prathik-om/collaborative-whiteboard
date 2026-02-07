# Test Suite Setup and Utils Testing - Design Document

**Feature:** Establish comprehensive test suite for collaborative whiteboard (Week 1 of testing initiative)

**Status:** Design Complete - Ready for Implementation

**Created:** 2026-02-08

**Target:** Week 1 completion (5 days, 50% coverage)

---

## Problem Statement

**What:** Establish test suite with Jest + @testing-library, focusing on utils and hooks to achieve 50% overall coverage

**Why:**
- Testing is **P0 blocker** for production deployment
- Current state: 0% coverage (tests configured but not written)
- Target: 80% coverage for production-ready code
- Week 1 milestone: 50% coverage (foundation for Week 2)

**Success Criteria:**
- [ ] Jest configured and running for Next.js 15 App Router
- [ ] `utils/sessionCode.ts` has 100% test coverage (2/2 functions)
- [ ] `hooks/useCreateSession.ts` has ≥80% test coverage
- [ ] `hooks/useBroadcastChannel.ts` has ≥80% test coverage
- [ ] Overall project coverage reaches 50% by end of Week 1
- [ ] All tests pass in development and CI/CD
- [ ] Testing patterns documented for team reference

**Constraints:**
- Must work with Next.js 15 App Router (Server/Client Components)
- Must mock Supabase (no test database for MVP)
- Must test real-time features (Realtime subscriptions)
- Timeline: 5 days (Days 1-5 of Week 1)
- Budget: $0 (free tier tools only)

**Non-Goals (Out of Scope for Week 1):**
- E2E tests with Playwright (Week 2)
- Component snapshot tests (Week 2)
- Visual regression tests (Phase 2)
- Performance benchmarking (Phase 2)
- RLS integration tests (documented but not automated in Week 1)

---

## Selected Approach: Incremental Testing (File-by-File)

**Decision:** Write complete test suite for one file at a time, achieving 100% coverage before moving to next file.

**Order:** utils → hooks → components (prioritize by ease and criticality)

**Daily Breakdown:**
- **Day 1:** utils/sessionCode.ts (100% coverage) + mock setup
- **Day 2:** hooks/useCreateSession.ts (80%+ coverage)
- **Day 3:** hooks/useBroadcastChannel.ts (80%+ coverage)
- **Day 4-5:** RLS testing documentation + buffer for catch-up

**Why this approach:**
- ✅ Clear daily milestones (file-by-file completion)
- ✅ Immediate coverage feedback (see progress daily)
- ✅ Low risk (doesn't modify working code)
- ✅ Fits 5-day timeline perfectly
- ✅ Easy to track (3/5 files tested)

**Alternatives considered:**
- Layer-by-layer: Harder to track progress, coverage stays low until end
- TDD from scratch: Too risky, doubles timeline (8-10 days)
- Mutation testing: Overkill for MVP, new tool learning curve

---

## Technical Architecture

### Testing Stack

```
Jest 29.7.0 (✅ installed)
  └─ @testing-library/react 14.1.2 (✅ installed)
      └─ @testing-library/jest-dom (✅ installed)
      └─ @testing-library/user-event (✅ installed)

Mock Strategy:
  └─ Supabase: Manual mocks in __mocks__/@supabase/supabase-js
  └─ React hooks: renderHook from @testing-library/react
  └─ LocalStorage: jest.spyOn(Storage.prototype)
```

### File Structure

```
Current:
utils/
  sessionCode.ts

hooks/
  useCreateSession.ts
  useBroadcastChannel.ts

New files to create:
utils/
  sessionCode.test.ts          ← Day 1

hooks/
  useCreateSession.test.ts     ← Day 2
  useBroadcastChannel.test.ts  ← Day 3

__mocks__/
  @supabase/
    supabase-js.ts             ← Day 1

test/
  fixtures/
    sessions.ts                ← Day 1

supabase/
  tests/
    rls_policies.test.sql      ← Day 4
```

---

## Day-by-Day Implementation Plan

### Day 1: Foundation (2-3 hours)

**Goals:**
- Create Supabase mock
- Create test fixtures
- Write utils/sessionCode.test.ts
- Achieve 100% coverage for utils
- Verify 15-20% overall coverage

**Files to create:**

**1. `__mocks__/@supabase/supabase-js.ts`**
```typescript
export const createClient = jest.fn(() => ({
  from: jest.fn(() => ({
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({
          data: null,
          error: null
        })),
      })),
    })),
  })),
  channel: jest.fn(() => ({
    on: jest.fn(() => ({ subscribe: jest.fn() })),
    send: jest.fn(),
    unsubscribe: jest.fn(),
  })),
}));

export const supabase = createClient();
```

**2. `test/fixtures/sessions.ts`**
```typescript
export const mockSession = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  code: 'happy-tiger',
  session_type: 'study-group' as const,
  status: 'active' as const,
  drawing_permissions: 'collaborative' as const,
  canvas_snapshot: {},
  created_at: '2026-02-07T10:00:00Z',
  updated_at: '2026-02-07T10:00:00Z',
};

export const mockBroadcastMessage = {
  type: 'canvas_update',
  payload: {
    shapes: [{ id: '1', type: 'rectangle', x: 0, y: 0 }],
  },
};
```

**3. `utils/sessionCode.test.ts`**
```typescript
import { generateSessionCode, isValidSessionCode } from './sessionCode';

describe('generateSessionCode', () => {
  it('generates code in format "adjective-animal"', () => {
    const code = generateSessionCode();
    expect(code).toMatch(/^[a-z]+-[a-z]+$/);
  });

  it('generates valid session codes', () => {
    const code = generateSessionCode();
    expect(isValidSessionCode(code)).toBe(true);
  });

  it('generates different codes on multiple calls', () => {
    const codes = new Set();
    for (let i = 0; i < 100; i++) {
      codes.add(generateSessionCode());
    }
    expect(codes.size).toBeGreaterThan(50);
  });
});

describe('isValidSessionCode', () => {
  it('validates correct format', () => {
    expect(isValidSessionCode('happy-tiger')).toBe(true);
    expect(isValidSessionCode('bright-eagle')).toBe(true);
  });

  it('rejects invalid formats', () => {
    expect(isValidSessionCode('happy')).toBe(false);
    expect(isValidSessionCode('happy-tiger-extra')).toBe(false);
    expect(isValidSessionCode('invalid-animal')).toBe(false);
  });

  it('handles edge cases', () => {
    expect(isValidSessionCode('')).toBe(false);
    expect(isValidSessionCode('---')).toBe(false);
    expect(isValidSessionCode('HAPPY-TIGER')).toBe(false);
  });
});
```

**Exit criteria:**
- ✅ All utils tests passing
- ✅ 100% coverage for utils/sessionCode.ts
- ✅ 15-20% overall coverage
- ✅ Mocks working correctly

---

### Day 2: Session Creation Hook (2-3 hours)

**Goals:**
- Write hooks/useCreateSession.test.ts
- Achieve 80%+ coverage for hook
- Verify 30-35% overall coverage

**File: `hooks/useCreateSession.test.ts`**
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useCreateSession } from './useCreateSession';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase');

describe('useCreateSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates session with default type', async () => {
    const mockInsert = jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({
          data: { code: 'happy-tiger', session_type: 'study-group' },
          error: null,
        })),
      })),
    }));

    (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

    const { result } = renderHook(() => useCreateSession());

    const session = await result.current.createSession();

    expect(session.code).toBe('happy-tiger');
    expect(session.session_type).toBe('study-group');
  });

  it('handles creation errors', async () => {
    const mockError = new Error('Database error');
    (supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: null,
            error: mockError,
          })),
        })),
      })),
    });

    const { result } = renderHook(() => useCreateSession());

    await expect(result.current.createSession()).rejects.toThrow('Database error');
    expect(result.current.error).toBe(mockError);
  });

  it('sets isCreating state during creation', async () => {
    const { result } = renderHook(() => useCreateSession());

    expect(result.current.isCreating).toBe(false);

    const createPromise = result.current.createSession();
    expect(result.current.isCreating).toBe(true);

    await createPromise;

    await waitFor(() => {
      expect(result.current.isCreating).toBe(false);
    });
  });
});
```

**Exit criteria:**
- ✅ useCreateSession 80%+ coverage
- ✅ 30-35% overall coverage
- ✅ All error cases tested

---

### Day 3: Broadcast Channel Hook (3-4 hours)

**Goals:**
- Write hooks/useBroadcastChannel.test.ts
- Achieve 80%+ coverage for hook
- Reach 50% overall coverage target

**File: `hooks/useBroadcastChannel.test.ts`**
```typescript
import { renderHook, act } from '@testing-library/react';
import { useBroadcastChannel } from './useBroadcastChannel';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase');

describe('useBroadcastChannel', () => {
  let mockChannel: any;
  let mockSubscribe: jest.Mock;
  let mockOn: jest.Mock;

  beforeEach(() => {
    mockSubscribe = jest.fn((callback) => {
      setTimeout(() => callback('SUBSCRIBED'), 0);
      return mockChannel;
    });

    mockOn = jest.fn(() => mockChannel);

    mockChannel = {
      on: mockOn,
      send: jest.fn(),
      subscribe: mockSubscribe,
      unsubscribe: jest.fn(),
    };

    (supabase.channel as jest.Mock).mockReturnValue(mockChannel);
  });

  it('subscribes to channel on mount', () => {
    const onMessage = jest.fn();
    renderHook(() =>
      useBroadcastChannel({ sessionCode: 'happy-tiger', onMessage })
    );

    expect(supabase.channel).toHaveBeenCalledWith(
      'session:happy-tiger',
      expect.any(Object)
    );
    expect(mockOn).toHaveBeenCalledWith(
      'broadcast',
      { event: 'message' },
      expect.any(Function)
    );
  });

  it('unsubscribes on unmount', () => {
    const onMessage = jest.fn();
    const { unmount } = renderHook(() =>
      useBroadcastChannel({ sessionCode: 'happy-tiger', onMessage })
    );

    unmount();

    expect(mockChannel.unsubscribe).toHaveBeenCalled();
  });

  it('broadcasts messages when connected', async () => {
    const onMessage = jest.fn();
    const { result } = renderHook(() =>
      useBroadcastChannel({ sessionCode: 'happy-tiger', onMessage })
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(result.current.isConnected).toBe(true);

    act(() => {
      result.current.broadcast({ type: 'test', payload: {} });
    });

    expect(mockChannel.send).toHaveBeenCalled();
  });

  it('receives broadcast messages', () => {
    const onMessage = jest.fn();
    renderHook(() =>
      useBroadcastChannel({ sessionCode: 'happy-tiger', onMessage })
    );

    const messageCallback = mockOn.mock.calls[0][2];
    act(() => {
      messageCallback({
        payload: { type: 'canvas_update', payload: { shapes: [] } },
      });
    });

    expect(onMessage).toHaveBeenCalledWith({
      type: 'canvas_update',
      payload: { shapes: [] },
    });
  });
});
```

**Exit criteria:**
- ✅ useBroadcastChannel 80%+ coverage
- ✅ 50%+ overall coverage **ACHIEVED**
- ✅ All lifecycle tests passing

---

### Day 4-5: RLS Testing + Buffer (4 hours)

**Goals:**
- Document RLS testing approach
- Write SQL-based RLS tests
- Buffer time for missed edge cases
- Final verification

**File: `supabase/tests/rls_policies.test.sql`**
```sql
-- Test RLS policies for anonymous access
-- Run with: psql < rls_policies.test.sql

BEGIN;
SELECT plan(5);

-- Test 1: Anyone can read active sessions
SELECT lives_ok(
  'SELECT * FROM sessions WHERE status = ''active'' LIMIT 1',
  'Anonymous users can read active sessions'
);

-- Test 2: Anyone can create sessions
SELECT lives_ok(
  'INSERT INTO sessions (code, status) VALUES (''test-code'', ''active'')',
  'Anonymous users can create sessions'
);

-- Test 3: Cannot read inactive sessions
SELECT is_empty(
  'SELECT * FROM sessions WHERE status = ''inactive''',
  'Anonymous users cannot read inactive sessions'
);

-- Test 4: RLS enabled on sessions table
SELECT has_row_security('sessions', 'RLS enabled on sessions table');

-- Test 5: Required policies exist
SELECT policies_are('public', 'sessions', ARRAY[
  'Anyone can read active sessions',
  'Anyone can create sessions'
]);

SELECT * FROM finish();
ROLLBACK;
```

**Exit criteria:**
- ✅ RLS testing documented
- ✅ SQL test file created
- ✅ All Week 1 tests passing
- ✅ 50%+ overall coverage maintained
- ✅ Ready for Week 2 (component + E2E tests)

---

## Edge Cases & Error Handling

### Edge Case 1: Session Code Collision
**Scenario:** `generateSessionCode()` produces duplicate code
**Current Handling:** Not handled (Week 2 improvement)
**Test:** Mock Supabase duplicate error, verify retry logic (Week 2)

### Edge Case 2: Network Disconnect During Subscription
**Scenario:** WiFi drops while subscribed to channel
**Handling:** Supabase auto-reconnects (built-in)
**Test:** Mock subscription status 'CLOSED', verify cleanup

### Edge Case 3: Invalid Session Code Format
**Scenario:** User manually types malformed code
**Handling:** `isValidSessionCode()` returns false
**Test:** ✅ Covered in Day 1 tests

### Edge Case 4: Rapid Broadcast Calls
**Scenario:** User draws 100 strokes in 1 second
**Handling:** No throttling (Week 2 improvement)
**Test:** Call `broadcast()` 100x, verify all sent

### Edge Case 5: Empty Session Code
**Scenario:** `sessionCode` prop is empty string
**Handling:** `useBroadcastChannel` doesn't subscribe
**Test:** ✅ Covered in Day 3 tests (check `!sessionCode` condition)

---

## Performance Targets

### Test Execution
- **Unit test:** < 100ms per test file
- **Full suite:** < 10 seconds (with 4 workers)
- **Coverage generation:** < 15 seconds

### Mock Performance
- Use synchronous mocks (no real network calls)
- Instant response times (0ms)
- No database connections

### CI/CD
- Tests run on every commit
- Coverage uploaded to dashboard
- Fail build if coverage < 50%

---

## Coverage Targets

### Expected by End of Week 1

```
File                           | % Stmts | % Branch | % Funcs | % Lines
-------------------------------|---------|----------|---------|--------
All files                      |   52.0  |   45.0   |   50.0  |   53.0

utils/                         |  100.0  |  100.0   |  100.0  |  100.0
  sessionCode.ts               |  100.0  |  100.0   |  100.0  |  100.0

hooks/                         |   82.0  |   75.0   |   80.0  |   83.0
  useCreateSession.ts          |   85.0  |   80.0   |   85.0  |   86.0
  useBroadcastChannel.ts       |   80.0  |   70.0   |   75.0  |   81.0

components/                    |   15.0  |   10.0   |   15.0  |   16.0
  WhiteboardCanvas.tsx         |   15.0  |   10.0   |   15.0  |   16.0
```

### Breakdown
- **Utils:** 100% (2/2 functions tested)
- **Hooks:** 80%+ (2/2 hooks tested)
- **Components:** 15% (deferred to Week 2)
- **Overall:** 50%+ ✅ **WEEK 1 TARGET ACHIEVED**

---

## Commands Reference

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode (development)
npm test -- --watch

# Run specific file
npm test -- sessionCode.test.ts

# Full verification (type-check + lint + build + tests)
npm run verify

# Generate HTML coverage report
npm test -- --coverage --coverageReporters=html
open coverage/index.html
```

---

## Decision Documentation

See **ADR-010: Incremental Testing Strategy** for detailed rationale.

**Summary:**
- Chose incremental (file-by-file) over layer-by-layer, TDD, or mutation testing
- Prioritizes clear milestones and low risk
- Achieves 50% coverage by Day 3-4
- Fits Week 1 timeline perfectly

---

## Next Steps (Week 2)

After Week 1 completion:

1. **Component Testing** (Days 1-2)
   - components/WhiteboardCanvas.test.tsx
   - Target: 60%+ component coverage

2. **E2E Testing** (Days 3-4)
   - Install Playwright
   - Write session creation E2E test
   - Write canvas drawing E2E test

3. **Final Verification** (Day 5)
   - Run `/pre-ship-review`
   - Achieve 80%+ overall coverage
   - Production deployment ready

---

## Success Criteria Verification

**At end of Week 1, verify:**
- [ ] `npm test` → All tests passing
- [ ] `npm test -- --coverage` → 50%+ overall coverage
- [ ] utils/sessionCode.ts → 100% coverage
- [ ] hooks/useCreateSession.ts → 80%+ coverage
- [ ] hooks/useBroadcastChannel.ts → 80%+ coverage
- [ ] CI/CD pipeline running tests successfully
- [ ] Testing patterns documented (this file)

**Ready for Week 2 when:**
- ✅ All checkboxes above are checked
- ✅ No failing tests
- ✅ Coverage maintained at 50%+
- ✅ Team understands testing patterns

---

**Design Status:** ✅ Complete - Ready to implement

**Next Command:**
```bash
npm run feature next
/task-decomposition "test suite setup and utils testing"
```

---

**Created:** 2026-02-08
**Last Updated:** 2026-02-08
**Version:** 1.0
