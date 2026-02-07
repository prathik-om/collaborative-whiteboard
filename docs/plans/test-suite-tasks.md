# Test Suite Setup - Task Decomposition

**Feature:** Test suite setup and utils testing (Week 1)

**Start Date:** 2026-02-08
**Target Completion:** 2026-02-13 (5 days)
**Status:** Ready to Execute

**Progress:** 0/22 tasks complete (0%)

---

## Quick Reference

**Today's Focus:** Phase 1 (Day 1) - Foundation & Utils
**Next Task:** Task 1 (can start immediately)
**Target Coverage:** 50% by end of Week 1

**Commands:**
```bash
# Run tests
npm test

# Check coverage
npm test -- --coverage

# Watch mode
npm test -- --watch

# Full verification
npm run verify
```

---

## Phase 1: Foundation & Mocks (Day 1) - CAN START NOW

**Target:** Mock infrastructure + utils tests → 15-20% coverage

### Task 1: Create Supabase mock directory structure
**Time:** 3 minutes
**Done when:** Directory `__mocks__/@supabase/` exists
**Verification:** `ls __mocks__/@supabase` → directory exists
**Dependencies:** None

```bash
mkdir -p __mocks__/@supabase
```

---

### Task 2: Create basic Supabase client mock
**Time:** 10 minutes
**Done when:** Mock file exports `createClient` function
**Verification:** Import mock in test → no TypeScript errors
**Dependencies:** Task 1

**File:** `__mocks__/@supabase/supabase-js.ts`
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

---

### Task 3: Create test fixtures directory
**Time:** 2 minutes
**Done when:** Directory `test/fixtures/` exists
**Verification:** `ls test/fixtures` → directory exists
**Dependencies:** None

```bash
mkdir -p test/fixtures
```

---

### Task 4: Create session test fixtures
**Time:** 8 minutes
**Done when:** File exports `mockSession` and `mockBroadcastMessage`
**Verification:** Import fixtures in test → TypeScript recognizes types
**Dependencies:** Task 3

**File:** `test/fixtures/sessions.ts`
```typescript
import type { Session } from '@/types/database.types';
import type { BroadcastMessage } from '@/hooks/useBroadcastChannel';

export const mockSession: Session = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  code: 'happy-tiger',
  session_type: 'study-group',
  status: 'active',
  drawing_permissions: 'collaborative',
  canvas_snapshot: {},
  created_at: '2026-02-07T10:00:00Z',
  updated_at: '2026-02-07T10:00:00Z',
};

export const mockBroadcastMessage: BroadcastMessage = {
  type: 'canvas_update',
  payload: {
    shapes: [{ id: '1', type: 'rectangle', x: 0, y: 0 }],
  },
};
```

---

### Task 5: Create sessionCode test file
**Time:** 3 minutes
**Done when:** File `utils/sessionCode.test.ts` exists with describe blocks
**Verification:** `npm test` → test file discovered
**Dependencies:** None

**File:** `utils/sessionCode.test.ts`
```typescript
import { generateSessionCode, isValidSessionCode } from './sessionCode';

describe('generateSessionCode', () => {
  // Tests will be added in next tasks
});

describe('isValidSessionCode', () => {
  // Tests will be added in next tasks
});
```

---

### Task 6: Write test for code format
**Time:** 5 minutes
**Done when:** Test verifies format is "adjective-animal"
**Verification:** `npm test sessionCode` → 1 test passing
**Dependencies:** Task 5

Add to `generateSessionCode` describe block:
```typescript
it('generates code in format "adjective-animal"', () => {
  const code = generateSessionCode();
  expect(code).toMatch(/^[a-z]+-[a-z]+$/);
});
```

---

### Task 7: Write test for code validity
**Time:** 5 minutes
**Done when:** Test verifies generated codes are valid
**Verification:** `npm test sessionCode` → 2 tests passing
**Dependencies:** Task 6

Add to `generateSessionCode` describe block:
```typescript
it('generates valid session codes', () => {
  const code = generateSessionCode();
  expect(isValidSessionCode(code)).toBe(true);
});
```

---

### Task 8: Write test for code uniqueness
**Time:** 8 minutes
**Done when:** Test verifies high variety in generated codes
**Verification:** `npm test sessionCode` → 3 tests passing
**Dependencies:** Task 7

Add to `generateSessionCode` describe block:
```typescript
it('generates different codes on multiple calls', () => {
  const codes = new Set();
  for (let i = 0; i < 100; i++) {
    codes.add(generateSessionCode());
  }
  // Should have high variety (at least 50 unique in 100 tries)
  expect(codes.size).toBeGreaterThan(50);
});
```

---

### Task 9: Write test for valid code formats
**Time:** 8 minutes
**Done when:** Test verifies correct formats are accepted
**Verification:** `npm test sessionCode` → 4 tests passing
**Dependencies:** Task 8

Add to `isValidSessionCode` describe block:
```typescript
it('validates correct format', () => {
  expect(isValidSessionCode('happy-tiger')).toBe(true);
  expect(isValidSessionCode('bright-eagle')).toBe(true);
  expect(isValidSessionCode('sunny-panda')).toBe(true);
});
```

---

### Task 10: Write test for invalid code formats
**Time:** 10 minutes
**Done when:** Test verifies invalid formats are rejected
**Verification:** `npm test sessionCode` → 5 tests passing
**Dependencies:** Task 9

Add to `isValidSessionCode` describe block:
```typescript
it('rejects invalid formats', () => {
  expect(isValidSessionCode('happy')).toBe(false);
  expect(isValidSessionCode('happy-tiger-extra')).toBe(false);
  expect(isValidSessionCode('invalid-animal')).toBe(false);
  expect(isValidSessionCode('happy-notananimal')).toBe(false);
});
```

---

### Task 11: Write test for edge cases
**Time:** 8 minutes
**Done when:** Test handles empty strings and malformed input
**Verification:** `npm test sessionCode` → 6 tests passing
**Dependencies:** Task 10

Add to `isValidSessionCode` describe block:
```typescript
it('handles edge cases', () => {
  expect(isValidSessionCode('')).toBe(false);
  expect(isValidSessionCode('---')).toBe(false);
  expect(isValidSessionCode('happy-')).toBe(false);
  expect(isValidSessionCode('-tiger')).toBe(false);
  expect(isValidSessionCode('HAPPY-TIGER')).toBe(false); // Case sensitive
});
```

---

### Task 12: Verify Day 1 coverage target
**Time:** 5 minutes
**Done when:** Utils coverage = 100%, overall ≥15%
**Verification:** `npm test -- --coverage` → see coverage report
**Dependencies:** Task 11

**Exit Criteria for Day 1:**
- ✅ All utils tests passing (6 tests)
- ✅ 100% coverage for utils/sessionCode.ts
- ✅ 15-20% overall coverage
- ✅ Mocks working correctly

---

## Phase 2: Session Creation Hook (Day 2) - AFTER PHASE 1

**Target:** useCreateSession tests → 30-35% coverage

### Task 13: Create useCreateSession test file
**Time:** 5 minutes
**Done when:** Test file exists with jest mocks configured
**Verification:** `npm test` → discovers new test file
**Dependencies:** All Phase 1 tasks

**File:** `hooks/useCreateSession.test.ts`
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useCreateSession } from './useCreateSession';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase');

describe('useCreateSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Tests will be added in next tasks
});
```

---

### Task 14: Mock Supabase for session creation
**Time:** 15 minutes
**Done when:** Mock returns session data correctly
**Verification:** Call mock in test → returns expected data
**Dependencies:** Task 13

Add mock setup:
```typescript
const mockSupabaseResponse = (data: any, error: any = null) => {
  const mockInsert = jest.fn(() => ({
    select: jest.fn(() => ({
      single: jest.fn(() => Promise.resolve({ data, error })),
    })),
  }));

  (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });
  return mockInsert;
};
```

---

### Task 15: Write test for successful session creation
**Time:** 15 minutes
**Done when:** Test creates session with default type
**Verification:** `npm test useCreateSession` → 1 test passing
**Dependencies:** Task 14

```typescript
it('creates session with default type', async () => {
  const mockData = {
    id: '123',
    code: 'happy-tiger',
    session_type: 'study-group',
    status: 'active',
  };

  mockSupabaseResponse(mockData);

  const { result } = renderHook(() => useCreateSession());
  const session = await result.current.createSession();

  expect(session.code).toBe('happy-tiger');
  expect(session.session_type).toBe('study-group');
});
```

---

### Task 16: Write test for error handling
**Time:** 12 minutes
**Done when:** Test handles database errors correctly
**Verification:** `npm test useCreateSession` → 2 tests passing
**Dependencies:** Task 15

```typescript
it('handles creation errors', async () => {
  const mockError = new Error('Database error');
  mockSupabaseResponse(null, mockError);

  const { result } = renderHook(() => useCreateSession());

  await expect(result.current.createSession()).rejects.toThrow('Database error');
  expect(result.current.error).toBe(mockError);
});
```

---

### Task 17: Write test for loading state
**Time:** 15 minutes
**Done when:** Test verifies isCreating state changes correctly
**Verification:** `npm test useCreateSession` → 3 tests passing
**Dependencies:** Task 16

```typescript
it('sets isCreating state during creation', async () => {
  const mockData = { code: 'happy-tiger' };
  mockSupabaseResponse(mockData);

  const { result } = renderHook(() => useCreateSession());

  expect(result.current.isCreating).toBe(false);

  const createPromise = result.current.createSession();
  expect(result.current.isCreating).toBe(true);

  await createPromise;

  await waitFor(() => {
    expect(result.current.isCreating).toBe(false);
  });
});
```

---

### Task 18: Verify Day 2 coverage target
**Time:** 5 minutes
**Done when:** useCreateSession coverage ≥80%, overall ≥30%
**Verification:** `npm test -- --coverage` → see coverage report
**Dependencies:** Task 17

**Exit Criteria for Day 2:**
- ✅ useCreateSession tests passing (3 tests)
- ✅ 80%+ coverage for useCreateSession.ts
- ✅ 30-35% overall coverage

---

## Phase 3: Broadcast Channel Hook (Day 3) - AFTER PHASE 2

**Target:** useBroadcastChannel tests → 50% coverage

### Task 19: Create useBroadcastChannel test file with mocks
**Time:** 20 minutes
**Done when:** Test file with full mock setup exists
**Verification:** `npm test` → discovers new test file
**Dependencies:** All Phase 2 tasks

**File:** `hooks/useBroadcastChannel.test.ts`
```typescript
import { renderHook, act } from '@testing-library/react';
import { useBroadcastChannel } from './useBroadcastChannel';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase');

describe('useBroadcastChannel', () => {
  let mockChannel: any;
  let mockSubscribe: jest.Mock;
  let mockOn: jest.Mock;
  let mockSend: jest.Mock;
  let mockUnsubscribe: jest.Mock;

  beforeEach(() => {
    mockSubscribe = jest.fn((callback) => {
      setTimeout(() => callback('SUBSCRIBED'), 0);
      return mockChannel;
    });

    mockOn = jest.fn(() => mockChannel);
    mockSend = jest.fn();
    mockUnsubscribe = jest.fn();

    mockChannel = {
      on: mockOn,
      send: mockSend,
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
    };

    (supabase.channel as jest.Mock).mockReturnValue(mockChannel);
  });

  // Tests will be added in next tasks
});
```

---

### Task 20: Write test for channel subscription
**Time:** 15 minutes
**Done when:** Test verifies channel subscribes on mount
**Verification:** `npm test useBroadcastChannel` → 1 test passing
**Dependencies:** Task 19

```typescript
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
  expect(mockSubscribe).toHaveBeenCalled();
});
```

---

### Task 21: Write test for cleanup on unmount
**Time:** 10 minutes
**Done when:** Test verifies unsubscribe is called
**Verification:** `npm test useBroadcastChannel` → 2 tests passing
**Dependencies:** Task 20

```typescript
it('unsubscribes on unmount', () => {
  const onMessage = jest.fn();
  const { unmount } = renderHook(() =>
    useBroadcastChannel({ sessionCode: 'happy-tiger', onMessage })
  );

  unmount();

  expect(mockUnsubscribe).toHaveBeenCalled();
});
```

---

### Task 22: Write test for broadcasting when connected
**Time:** 20 minutes
**Done when:** Test verifies messages are broadcast
**Verification:** `npm test useBroadcastChannel` → 3 tests passing
**Dependencies:** Task 21

```typescript
it('broadcasts messages when connected', async () => {
  const onMessage = jest.fn();
  const { result } = renderHook(() =>
    useBroadcastChannel({ sessionCode: 'happy-tiger', onMessage })
  );

  // Wait for connection
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 10));
  });

  expect(result.current.isConnected).toBe(true);

  act(() => {
    result.current.broadcast({ type: 'test', payload: { data: 123 } });
  });

  expect(mockSend).toHaveBeenCalledWith({
    type: 'broadcast',
    event: 'message',
    payload: { type: 'test', payload: { data: 123 } },
  });
});
```

---

### Task 23: Write test for not broadcasting when disconnected
**Time:** 10 minutes
**Done when:** Test verifies no broadcast before connection
**Verification:** `npm test useBroadcastChannel` → 4 tests passing
**Dependencies:** Task 22

```typescript
it('does not broadcast when not connected', () => {
  const onMessage = jest.fn();
  const { result } = renderHook(() =>
    useBroadcastChannel({ sessionCode: 'happy-tiger', onMessage })
  );

  // Before connection
  act(() => {
    result.current.broadcast({ type: 'test', payload: {} });
  });

  expect(mockSend).not.toHaveBeenCalled();
});
```

---

### Task 24: Write test for receiving messages
**Time:** 15 minutes
**Done when:** Test verifies onMessage is called
**Verification:** `npm test useBroadcastChannel` → 5 tests passing
**Dependencies:** Task 23

```typescript
it('receives broadcast messages', () => {
  const onMessage = jest.fn();
  renderHook(() =>
    useBroadcastChannel({ sessionCode: 'happy-tiger', onMessage })
  );

  // Simulate receiving a message
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
```

---

### Task 25: Verify Day 3 coverage target (MILESTONE!)
**Time:** 5 minutes
**Done when:** useBroadcastChannel ≥80%, overall ≥50% ✅
**Verification:** `npm test -- --coverage` → 50%+ overall coverage
**Dependencies:** Task 24

**Exit Criteria for Day 3:**
- ✅ useBroadcastChannel tests passing (5 tests)
- ✅ 80%+ coverage for useBroadcastChannel.ts
- ✅ **50%+ overall coverage ACHIEVED** 🎉

---

## Phase 4: Documentation & Buffer (Days 4-5) - AFTER PHASE 3

**Target:** RLS documentation + catch-up time

### Task 26: Create RLS testing directory
**Time:** 2 minutes
**Done when:** Directory `supabase/tests/` exists
**Verification:** `ls supabase/tests` → directory exists
**Dependencies:** Task 25

```bash
mkdir -p supabase/tests
```

---

### Task 27: Document RLS testing approach
**Time:** 30 minutes
**Done when:** File documents how to test RLS policies
**Verification:** File exists, readable documentation
**Dependencies:** Task 26

**File:** `supabase/tests/README.md`
```markdown
# RLS Policy Testing

## Overview
RLS (Row Level Security) policies enforce data access rules at the database level.
For anonymous collaborative whiteboard, we need to test:
1. Anyone can read active sessions
2. Anyone can create sessions
3. Cannot read inactive sessions

## How to Test

### Manual Testing (Quick)
1. Open Supabase SQL Editor
2. Run queries as anonymous user
3. Verify expected access patterns

### Automated Testing (Week 2)
Use pgTAP for SQL-based tests (see rls_policies.test.sql)

## Test Scenarios
[... detailed scenarios ...]
```

---

### Task 28: Create SQL test template for RLS
**Time:** 20 minutes
**Done when:** SQL test file with 5 test cases exists
**Verification:** File is valid SQL (no syntax errors)
**Dependencies:** Task 27

**File:** `supabase/tests/rls_policies.test.sql`
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

---

### Task 29: Run final verification
**Time:** 10 minutes
**Done when:** All tests pass, 50%+ coverage maintained
**Verification:** `npm run feature verify` → all checks pass
**Dependencies:** Task 28

```bash
# Run full verification
npm run feature verify

# Expected output:
# ✅ Type check passed
# ✅ Lint check passed
# ✅ Build succeeded
# ✅ All tests passed
# ✅ Coverage: 52% (target: 50%)
```

---

### Task 30: Create testing patterns guide
**Time:** 20 minutes
**Done when:** Document patterns for team reference
**Verification:** File exists with examples
**Dependencies:** Task 29

**File:** `docs/testing-patterns.md`
```markdown
# Testing Patterns Guide

## Pattern 1: Mocking Supabase
[... examples from our tests ...]

## Pattern 2: Testing Hooks
[... renderHook patterns ...]

## Pattern 3: Async Testing
[... waitFor, act patterns ...]

[Link to actual test files as reference]
```

---

## Summary & Metrics

### Time Estimates
- **Phase 1 (Day 1):** 12 tasks, ~70 minutes
- **Phase 2 (Day 2):** 6 tasks, ~72 minutes
- **Phase 3 (Day 3):** 7 tasks, ~105 minutes
- **Phase 4 (Days 4-5):** 5 tasks, ~82 minutes
- **Total:** 30 tasks, ~5.5 hours (with buffer time for debugging)

### Coverage Progression
- **After Phase 1:** 15-20% coverage
- **After Phase 2:** 30-35% coverage
- **After Phase 3:** 50%+ coverage ✅ **TARGET ACHIEVED**
- **After Phase 4:** 50%+ coverage maintained

### Risk Mitigation
- **Buffer time:** Days 4-5 have only 82 minutes of tasks (leaves 6+ hours for catch-up)
- **Incremental validation:** Coverage checked after each phase
- **Early warning:** If Phase 1 or 2 slips, still have time to recover

---

## Progress Tracking Template

```markdown
## Daily Status: Day X

**Date:** YYYY-MM-DD
**Tasks Completed:** X/Y
**Coverage:** X%
**Blockers:** None / [List blockers]

### Completed Today
- [x] Task N: Description (est 10 min, actual 12 min)
- [x] Task N+1: Description (est 15 min, actual 14 min)

### Tomorrow's Plan
- [ ] Task N+2: Description (15 min)
- [ ] Task N+3: Description (20 min)

### Notes
- [Any learnings, issues, or adjustments]
```

---

## Next Steps

**To start implementation:**
```bash
# 1. Check current status
npm run feature status

# 2. Move to execution phase
npm run feature next

# 3. Start systematic execution
/systematic-execution "test suite setup and utils testing"
```

**Then work through tasks sequentially, using `/self-verification` after each code task.**

---

**Created:** 2026-02-08
**Last Updated:** 2026-02-08
**Total Tasks:** 30
**Estimated Time:** 5.5 hours (across 5 days)
**Ready to Execute:** ✅ YES
