# Testing Strategy - Path to 80% Coverage

**Status:** Planning
**Priority:** P0 (BLOCKER for production)
**Target Coverage:** ≥80% overall
**Target Completion:** Week 1 of Phase 2

---

## Current State

**Test Coverage:** 0% (no tests written yet)
**Tests Passing:** 0/0
**Testing Infrastructure:** Jest + @testing-library/react configured but unused

**Blockers:**
- ⚠️ No tests = no confidence in production deployment
- ⚠️ Refactoring is risky without test coverage
- ⚠️ Can't verify bug fixes work without regression tests

---

## Testing Philosophy

### Test-Driven Development (TDD)
**Adopt TDD for all new features starting Phase 2:**
1. Write failing test first
2. Watch it fail (red)
3. Implement minimal code to pass (green)
4. Refactor (keep tests green)
5. Repeat

**Benefits:**
- Forces you to think about API design
- Ensures all code is testable
- Prevents over-engineering
- Documents expected behavior

### Testing Pyramid

```
        /\
       /  \      E2E Tests (5-10%)
      /────\     - Critical user flows
     /      \    - Session creation → collaboration
    /────────\
   /          \  Integration Tests (20-30%)
  /────────────\ - Real-time sync
 /              \- Database queries
/────────────────\
|  Unit Tests    | Unit Tests (60-75%)
|  (Majority)    | - Hooks, utilities, business logic
└────────────────┘
```

**Coverage Targets by Layer:**
- **Unit Tests:** 60-75% of total coverage
- **Integration Tests:** 20-30% of total coverage
- **E2E Tests:** 5-10% of total coverage

**Coverage Targets by File Type:**
- **Utils:** 100% (pure functions, easy to test)
- **Hooks:** ≥80% (business logic)
- **Components:** ≥60% (UI behavior)
- **API Routes:** ≥80% (validation, error handling)
- **Pages:** ≥40% (mostly composition)

---

## Testing Plan by Priority

### Phase 1: Critical Path (Week 1, Days 1-3)

**Goal:** Cover the most critical functionality first

#### 1.1 Session Creation (P0)
**File:** `hooks/useCreateSession.ts`
**Coverage Target:** 100%

**Test Cases:**
- ✅ Creates session with valid code format (`adjective-animal`)
- ✅ Retries on collision (23505 error code)
- ✅ Fails after 5 attempts
- ✅ Throws on non-collision errors
- ✅ Returns session with code, id, created_at

**Test Implementation:**
```typescript
// hooks/useCreateSession.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useCreateSession } from './useCreateSession'
import { supabase } from '@/lib/supabase'

// Mock Supabase
jest.mock('@/lib/supabase')

describe('useCreateSession', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates session with valid code format', async () => {
    const mockSession = {
      id: '123',
      code: 'happy-tiger',
      created_at: new Date().toISOString()
    }

    supabase.from.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockSession, error: null })
        })
      })
    })

    const { result } = renderHook(() => useCreateSession())

    await waitFor(() => {
      expect(result.current.session).toEqual(mockSession)
      expect(result.current.session.code).toMatch(/^[a-z]+-[a-z]+$/)
    })
  })

  it('retries on collision', async () => {
    const collisionError = { code: '23505', message: 'duplicate key' }
    const mockSession = { id: '123', code: 'bright-eagle', created_at: new Date().toISOString() }

    supabase.from
      .mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: collisionError })
          })
        })
      })
      .mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockSession, error: null })
          })
        })
      })

    const { result } = renderHook(() => useCreateSession())

    await waitFor(() => {
      expect(result.current.session).toEqual(mockSession)
      expect(result.current.error).toBeNull()
    })
  })

  it('fails after 5 collision attempts', async () => {
    const collisionError = { code: '23505', message: 'duplicate key' }

    supabase.from.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: collisionError })
        })
      })
    })

    const { result } = renderHook(() => useCreateSession())

    await waitFor(() => {
      expect(result.current.error).toBeDefined()
      expect(result.current.error.message).toContain('Failed to generate unique session code')
    })
  })
})
```

#### 1.2 Session Code Generation (P0)
**File:** `utils/sessionCode.ts`
**Coverage Target:** 100%

**Test Cases:**
- ✅ Generates code in `adjective-animal` format
- ✅ Only uses valid adjectives (from list)
- ✅ Only uses valid animals (from list)
- ✅ Generates different codes (randomness check)

```typescript
// utils/sessionCode.test.ts
import { generateSessionCode, adjectives, animals } from './sessionCode'

describe('generateSessionCode', () => {
  it('generates code in adjective-animal format', () => {
    const code = generateSessionCode()
    expect(code).toMatch(/^[a-z]+-[a-z]+$/)
  })

  it('uses valid adjectives and animals', () => {
    const code = generateSessionCode()
    const [adjective, animal] = code.split('-')

    expect(adjectives).toContain(adjective)
    expect(animals).toContain(animal)
  })

  it('generates different codes (randomness)', () => {
    const codes = new Set()
    for (let i = 0; i < 100; i++) {
      codes.add(generateSessionCode())
    }

    // Should generate at least 50 unique codes out of 100 attempts
    expect(codes.size).toBeGreaterThan(50)
  })
})
```

#### 1.3 Broadcast Channel (P0)
**File:** `hooks/useBroadcastChannel.ts`
**Coverage Target:** ≥80%

**Test Cases:**
- ✅ Subscribes to correct channel (`session:${sessionCode}`)
- ✅ Receives messages from other participants
- ✅ Broadcasts messages to channel
- ✅ Unsubscribes on cleanup
- ✅ Handles reconnection

```typescript
// hooks/useBroadcastChannel.test.ts
import { renderHook, act } from '@testing-library/react'
import { useBroadcastChannel } from './useBroadcastChannel'

// Mock Supabase Realtime
const mockChannel = {
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn().mockReturnThis(),
  unsubscribe: jest.fn(),
  send: jest.fn()
}

jest.mock('@/lib/supabase', () => ({
  supabase: {
    channel: jest.fn(() => mockChannel)
  }
}))

describe('useBroadcastChannel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('subscribes to session channel', () => {
    renderHook(() => useBroadcastChannel('happy-tiger'))

    expect(supabase.channel).toHaveBeenCalledWith('session:happy-tiger')
    expect(mockChannel.subscribe).toHaveBeenCalled()
  })

  it('unsubscribes on cleanup', () => {
    const { unmount } = renderHook(() => useBroadcastChannel('happy-tiger'))

    unmount()

    expect(mockChannel.unsubscribe).toHaveBeenCalled()
  })

  it('broadcasts messages', () => {
    const { result } = renderHook(() => useBroadcastChannel('happy-tiger'))

    act(() => {
      result.current.broadcast({ type: 'test', payload: { data: 'hello' } })
    })

    expect(mockChannel.send).toHaveBeenCalledWith({
      type: 'broadcast',
      event: 'canvas_changes',
      payload: { type: 'test', payload: { data: 'hello' } }
    })
  })
})
```

---

### Phase 2: Database & RLS (Week 1, Days 4-5)

#### 2.1 RLS Policies (P0)
**Test Location:** `tests/database/rls.test.ts`
**Coverage Target:** 100% of policies

**Test Cases:**
- ✅ Anyone can read active sessions by code
- ✅ Anyone can create sessions
- ✅ Cannot read ended sessions
- ✅ Participants can read their session
- ✅ Anyone can join as participant

**Test Implementation:**
```typescript
// tests/database/rls.test.ts
import { supabase } from '@/lib/supabase'

describe('RLS Policies', () => {
  describe('sessions table', () => {
    it('allows anyone to read active sessions', async () => {
      // Create test session
      const { data: session } = await supabase
        .from('sessions')
        .insert({ code: 'test-session', status: 'active' })
        .select()
        .single()

      // Read as anonymous user (no auth)
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('code', 'test-session')
        .single()

      expect(error).toBeNull()
      expect(data.code).toBe('test-session')
    })

    it('prevents reading ended sessions', async () => {
      // Create ended session
      await supabase
        .from('sessions')
        .insert({ code: 'ended-session', status: 'ended' })

      // Try to read as anonymous user
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('code', 'ended-session')
        .single()

      expect(data).toBeNull()
      expect(error).toBeDefined()
    })
  })
})
```

#### 2.2 Database Queries (P1)
**Coverage Target:** ≥80%

**Test Cases:**
- ✅ Query sessions by code
- ✅ Update canvas snapshot
- ✅ Insert participant
- ✅ Handle duplicate session code
- ✅ Handle missing session

---

### Phase 3: Components & UI (Week 2, Days 1-2)

#### 3.1 WhiteboardCanvas Component (P1)
**File:** `components/WhiteboardCanvas.tsx`
**Coverage Target:** ≥60%

**Test Cases:**
- ✅ Renders tldraw editor
- ✅ Loads snapshot on mount
- ✅ Broadcasts changes on edit
- ✅ Applies remote changes
- ✅ Cleans up listeners on unmount

```typescript
// components/WhiteboardCanvas.test.tsx
import { render, screen } from '@testing-library/react'
import { WhiteboardCanvas } from './WhiteboardCanvas'

// Mock tldraw
jest.mock('@tldraw/tldraw', () => ({
  Tldraw: ({ onMount }) => {
    // Simulate editor mount
    useEffect(() => {
      onMount?.({ store: mockStore })
    }, [])
    return <div data-testid="tldraw-canvas">Canvas</div>
  }
}))

describe('WhiteboardCanvas', () => {
  it('renders tldraw editor', () => {
    render(<WhiteboardCanvas sessionCode="happy-tiger" />)
    expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument()
  })

  it('loads snapshot on mount', async () => {
    const mockSnapshot = { shapes: [{ id: '1', type: 'geo' }] }

    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { canvas_snapshot: mockSnapshot },
            error: null
          })
        })
      })
    })

    render(<WhiteboardCanvas sessionCode="happy-tiger" />)

    await waitFor(() => {
      expect(mockStore.loadSnapshot).toHaveBeenCalledWith(mockSnapshot)
    })
  })
})
```

#### 3.2 ConnectionStatus Component (P2)
**Coverage Target:** ≥60%

**Test Cases:**
- ✅ Shows "Connected" when online
- ✅ Shows "Connecting..." when reconnecting
- ✅ Shows participant count
- ✅ Updates in real-time

---

### Phase 4: E2E Critical Paths (Week 2, Days 3-4)

**Tool:** Playwright

#### 4.1 Session Creation Flow (P0)
```typescript
// tests/e2e/session-creation.spec.ts
import { test, expect } from '@playwright/test'

test('user can create and join session', async ({ page }) => {
  // Go to landing page
  await page.goto('/')

  // Click create button
  await page.click('text=Create Whiteboard')

  // Should redirect to board page
  await expect(page).toHaveURL(/\/board\?code=[a-z]+-[a-z]+/)

  // Canvas should be visible
  await expect(page.locator('[data-testid="tldraw-canvas"]')).toBeVisible()
})
```

#### 4.2 Real-Time Collaboration (P0)
```typescript
// tests/e2e/collaboration.spec.ts
import { test, expect } from '@playwright/test'

test('multiple users see each other's changes', async ({ browser }) => {
  const context1 = await browser.newContext()
  const context2 = await browser.newContext()

  const page1 = await context1.newPage()
  const page2 = await context2.newPage()

  // User 1 creates session
  await page1.goto('/')
  await page1.click('text=Create Whiteboard')
  const url = page1.url()
  const sessionCode = new URL(url).searchParams.get('code')

  // User 2 joins same session
  await page2.goto(`/board?code=${sessionCode}`)

  // User 1 draws something
  await page1.locator('[data-testid="tldraw-canvas"]').click({ position: { x: 100, y: 100 } })
  await page1.mouse.down()
  await page1.mouse.move(200, 200)
  await page1.mouse.up()

  // Wait for sync
  await page2.waitForTimeout(500)

  // User 2 should see the drawing
  const shapes1 = await page1.evaluate(() => editor.store.allShapes().length)
  const shapes2 = await page2.evaluate(() => editor.store.allShapes().length)

  expect(shapes1).toBeGreaterThan(0)
  expect(shapes2).toBe(shapes1)
})
```

#### 4.3 Late Joiner Recovery (P0)
```typescript
// tests/e2e/late-joiner.spec.ts
test('late joiner sees existing canvas', async ({ browser }) => {
  const context1 = await browser.newContext()
  const context2 = await browser.newContext()

  const page1 = await context1.newPage()

  // User 1 creates session and draws
  await page1.goto('/')
  await page1.click('text=Create Whiteboard')
  const sessionCode = new URL(page1.url()).searchParams.get('code')

  // Draw something
  await page1.locator('[data-testid="tldraw-canvas"]').click({ position: { x: 100, y: 100 } })
  await page1.mouse.down()
  await page1.mouse.move(200, 200)
  await page1.mouse.up()

  // Wait for snapshot to save
  await page1.waitForTimeout(6000)

  // User 2 joins later
  const page2 = await context2.newPage()
  await page2.goto(`/board?code=${sessionCode}`)

  // User 2 should see User 1's drawing
  const shapes2 = await page2.evaluate(() => editor.store.allShapes().length)
  expect(shapes2).toBeGreaterThan(0)
})
```

---

## Test Infrastructure Setup

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  collectCoverageFrom: [
    'hooks/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'utils/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!**/*.test.{ts,tsx}',
    '!**/node_modules/**'
  ],
  coverageThresholds: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80
    }
  }
}
```

### Test Setup File
```typescript
// tests/setup.ts
import '@testing-library/jest-dom'

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'

// Global test utilities
global.mockSupabase = () => {
  // Mock Supabase client
}
```

### Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: 2,
  workers: 4,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'webkit', use: { browserName: 'webkit' } }
  ]
})
```

---

## Running Tests

### Commands
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test hooks/useCreateSession.test.ts

# Run in watch mode
npm test -- --watch

# Run E2E tests
npm run test:e2e

# Run E2E in UI mode (debug)
npx playwright test --ui
```

### CI/CD Integration
```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3

      - name: Run E2E tests
        run: npm run test:e2e
```

---

## Coverage Tracking

### View Coverage Report
```bash
npm test -- --coverage
open coverage/lcov-report/index.html
```

### Coverage Goals by File

| File | Current | Target | Priority |
|------|---------|--------|----------|
| `utils/sessionCode.ts` | 0% | 100% | P0 |
| `hooks/useCreateSession.ts` | 0% | 100% | P0 |
| `hooks/useBroadcastChannel.ts` | 0% | 80% | P0 |
| `components/WhiteboardCanvas.tsx` | 0% | 60% | P1 |
| `components/ConnectionStatus.tsx` | 0% | 60% | P2 |
| `app/board/page.tsx` | 0% | 40% | P2 |

---

## Success Metrics

**Week 1 Goal:**
- [ ] 50%+ overall coverage
- [ ] All P0 files tested (session creation, broadcast, RLS)
- [ ] 2+ E2E tests passing

**Week 2 Goal:**
- [ ] 80%+ overall coverage
- [ ] All critical paths covered by E2E tests
- [ ] CI/CD running tests on every PR

**Production Criteria:**
- [ ] ≥80% total coverage
- [ ] 100% of utils covered
- [ ] All E2E tests passing
- [ ] No skipped/ignored tests

---

## Related Documents

- [Product Roadmap](product-roadmap.md) - Testing is Phase 2 blocker
- [CLAUDE.md](../../CLAUDE.md) - Testing philosophy and standards
- [Architecture Decisions](architecture-decisions.md) - Why Jest + Playwright

---

**Next Actions:**
1. Set up Jest and Playwright (Day 1)
2. Write tests for `sessionCode.ts` (Day 1)
3. Write tests for `useCreateSession.ts` (Day 2)
4. Write tests for `useBroadcastChannel.ts` (Day 3)
5. Reach 50% coverage by end of Week 1
