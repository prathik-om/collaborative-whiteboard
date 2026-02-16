// Tests for useCreateSession hook
import { renderHook, waitFor } from '@testing-library/react';
import type { Session } from '@/types/database.types';

// Mock Supabase BEFORE importing anything that uses it
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock session code generator with controllable return values
jest.mock('@/utils/sessionCode');

// Now import after mocks are set up
import { supabase } from '@/lib/supabase';
import { generateSessionCode } from '@/utils/sessionCode';
import { useCreateSession } from './useCreateSession';

const mockGenerateSessionCode = generateSessionCode as jest.MockedFunction<typeof generateSessionCode>;

describe('useCreateSession', () => {
  // Helper function to mock Supabase responses
  const mockSupabaseResponse = (data: Session | null, error: any = null) => {
    const mockInsert = jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data, error })),
      })),
    }));

    (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });
    return mockInsert;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementation
    mockGenerateSessionCode.mockReturnValue('happy-tiger-42');
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useCreateSession());

    expect(result.current.isCreating).toBe(false);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.createSession).toBe('function');
  });

  it('should create session with default type', async () => {
    const mockData: Session = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      code: 'happy-tiger-42',
      session_type: 'study-group',
      status: 'active',
      drawing_permissions: 'collaborative',
      canvas_snapshot: {},
      created_at: '2026-02-07T10:00:00Z',
      ended_at: null,
      last_activity_at: '2026-02-07T10:00:00Z',
      user_id: null,
      created_by_device_id: 'device_123',
      session_name: null,
      is_public: true,
      default_participant_role: 'viewer',
    };

    const mockInsert = mockSupabaseResponse(mockData);

    const { result } = renderHook(() => useCreateSession());

    // Call createSession
    let session: Session | undefined;
    await waitFor(async () => {
      session = await result.current.createSession();
    });

    // Verify session was created with correct properties
    expect(session).toBeDefined();
    expect(session!.code).toBe('happy-tiger-42');
    expect(session!.session_type).toBe('study-group');
    expect(session!.status).toBe('active');
    expect(session!.drawing_permissions).toBe('collaborative');

    // Verify isCreating state was managed correctly
    expect(result.current.isCreating).toBe(false);
    expect(result.current.error).toBe(null);

    // Verify Supabase was called correctly
    expect(mockInsert).toHaveBeenCalledWith([{
      code: 'happy-tiger-42',
      session_type: 'study-group',
      status: 'active',
      drawing_permissions: 'collaborative',
    }]);
  });

  it('should handle database errors', async () => {
    const mockError = new Error('Database connection failed');
    mockSupabaseResponse(null, mockError);

    const { result } = renderHook(() => useCreateSession());

    // Attempt to create session and expect error
    let thrownError: Error | undefined;
    await waitFor(async () => {
      try {
        await result.current.createSession();
      } catch (err) {
        thrownError = err as Error;
      }
    });

    // Verify error was thrown
    expect(thrownError).toBeDefined();
    expect(thrownError?.message).toBe('Database connection failed');

    // Verify error state was set
    await waitFor(() => {
      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe('Database connection failed');
    });

    // Verify isCreating is false after error
    expect(result.current.isCreating).toBe(false);
  });

  it('should handle missing data', async () => {
    // Mock returns no data and no error (edge case)
    mockSupabaseResponse(null, null);

    const { result } = renderHook(() => useCreateSession());

    // Attempt to create session and expect error
    let thrownError: Error | undefined;
    await waitFor(async () => {
      try {
        await result.current.createSession();
      } catch (err) {
        thrownError = err as Error;
      }
    });

    // Verify error was thrown
    expect(thrownError).toBeDefined();
    expect(thrownError?.message).toBe('Failed to create session: no data returned');

    // Verify error state was set
    await waitFor(() => {
      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe('Failed to create session: no data returned');
    });

    // Verify isCreating is false after error
    expect(result.current.isCreating).toBe(false);
  });

  it('should manage loading state correctly', async () => {
    const mockData: Session = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      code: 'happy-tiger-42',
      session_type: 'study-group',
      status: 'active',
      drawing_permissions: 'collaborative',
      canvas_snapshot: {},
      created_at: '2026-02-07T10:00:00Z',
      ended_at: null,
      last_activity_at: '2026-02-07T10:00:00Z',
      user_id: null,
      created_by_device_id: 'device_123',
      session_name: null,
      is_public: true,
      default_participant_role: 'viewer',
    };

    // Mock with a slight delay to capture loading state
    const mockInsert = jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() =>
          new Promise(resolve =>
            setTimeout(() => resolve({ data: mockData, error: null }), 100)
          )
        ),
      })),
    }));

    (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

    const { result } = renderHook(() => useCreateSession());

    // Initial state: not creating
    expect(result.current.isCreating).toBe(false);

    // Start creating session
    const createPromise = result.current.createSession();

    // Should be creating now
    await waitFor(() => {
      expect(result.current.isCreating).toBe(true);
    });

    // Wait for completion
    await createPromise;

    // Should no longer be creating
    await waitFor(() => {
      expect(result.current.isCreating).toBe(false);
    });
  });

  // ==================== COLLISION RETRY TESTS ====================

  it('should retry on session code collision (error 23505)', async () => {
    // Generate different codes for each attempt
    mockGenerateSessionCode
      .mockReturnValueOnce('happy-tiger-42')  // First attempt: collision
      .mockReturnValueOnce('bright-eagle-17'); // Second attempt: success

    const mockData: Session = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      code: 'bright-eagle-17',
      session_type: 'study-group',
      status: 'active',
      drawing_permissions: 'collaborative',
      canvas_snapshot: {},
      created_at: '2026-02-07T10:00:00Z',
      ended_at: null,
      last_activity_at: '2026-02-07T10:00:00Z',
      user_id: null,
      created_by_device_id: 'device_123',
      session_name: null,
      is_public: true,
      default_participant_role: 'viewer',
    };

    // First call: return collision error (PostgreSQL unique constraint violation)
    // Second call: return success
    let callCount = 0;
    const mockInsert = jest.fn(() => {
      callCount++;
      if (callCount === 1) {
        // First attempt: collision
        return {
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: null,
              error: { code: '23505', message: 'duplicate key value violates unique constraint "sessions_code_key"' }
            })),
          })),
        };
      } else {
        // Second attempt: success
        return {
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: mockData, error: null })),
          })),
        };
      }
    });

    (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

    const { result } = renderHook(() => useCreateSession());

    // Call createSession
    let session: Session | undefined;
    await waitFor(async () => {
      session = await result.current.createSession();
    });

    // Verify it succeeded with the second code
    expect(session).toBeDefined();
    expect(session!.code).toBe('bright-eagle-17');
    expect(result.current.error).toBe(null);

    // Verify it tried twice
    expect(mockInsert).toHaveBeenCalledTimes(2);
    expect(mockGenerateSessionCode).toHaveBeenCalledTimes(2);
  });

  it('should retry multiple times before succeeding', async () => {
    // Generate different codes for each attempt
    mockGenerateSessionCode
      .mockReturnValueOnce('happy-tiger-42')   // Attempt 1: collision
      .mockReturnValueOnce('bright-eagle-17')  // Attempt 2: collision
      .mockReturnValueOnce('cool-wolf-88')     // Attempt 3: collision
      .mockReturnValueOnce('fast-fox-5');     // Attempt 4: success

    const mockData: Session = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      code: 'fast-fox-5',
      session_type: 'study-group',
      status: 'active',
      drawing_permissions: 'collaborative',
      canvas_snapshot: {},
      created_at: '2026-02-07T10:00:00Z',
      ended_at: null,
      last_activity_at: '2026-02-07T10:00:00Z',
      user_id: null,
      created_by_device_id: 'device_123',
      session_name: null,
      is_public: true,
      default_participant_role: 'viewer',
    };

    let callCount = 0;
    const mockInsert = jest.fn(() => {
      callCount++;
      if (callCount <= 3) {
        // First 3 attempts: collision
        return {
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: null,
              error: { code: '23505', message: 'duplicate key value violates unique constraint "sessions_code_key"' }
            })),
          })),
        };
      } else {
        // Fourth attempt: success
        return {
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: mockData, error: null })),
          })),
        };
      }
    });

    (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

    const { result } = renderHook(() => useCreateSession());

    // Call createSession
    let session: Session | undefined;
    await waitFor(async () => {
      session = await result.current.createSession();
    });

    // Verify it succeeded with the fourth code
    expect(session).toBeDefined();
    expect(session!.code).toBe('fast-fox-5');
    expect(result.current.error).toBe(null);

    // Verify it tried 4 times
    expect(mockInsert).toHaveBeenCalledTimes(4);
    expect(mockGenerateSessionCode).toHaveBeenCalledTimes(4);
  });

  it('should fail after 5 collision attempts', async () => {
    // Mock all 5 attempts to return collision errors
    mockGenerateSessionCode
      .mockReturnValueOnce('happy-tiger-42')
      .mockReturnValueOnce('bright-eagle-17')
      .mockReturnValueOnce('cool-wolf-88')
      .mockReturnValueOnce('fast-fox-5')
      .mockReturnValueOnce('smart-bear-99');

    // All attempts return collision error
    const mockInsert = jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({
          data: null,
          error: { code: '23505', message: 'duplicate key value violates unique constraint "sessions_code_key"' }
        })),
      })),
    }));

    (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

    const { result } = renderHook(() => useCreateSession());

    // Attempt to create session and expect error
    let thrownError: Error | undefined;
    await waitFor(async () => {
      try {
        await result.current.createSession();
      } catch (err) {
        thrownError = err as Error;
      }
    });

    // Verify it failed with the correct error message
    expect(thrownError).toBeDefined();
    expect(thrownError?.message).toBe('Failed to generate unique session code after 5 attempts');

    // Verify error state was set
    await waitFor(() => {
      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe('Failed to generate unique session code after 5 attempts');
    });

    // Verify it tried exactly 5 times
    expect(mockInsert).toHaveBeenCalledTimes(5);
    expect(mockGenerateSessionCode).toHaveBeenCalledTimes(5);
  });

  it('should NOT retry for non-collision errors', async () => {
    mockGenerateSessionCode.mockReturnValue('happy-tiger-42');

    // Mock a different error (not collision)
    // Supabase errors are plain objects with code and message
    const mockError = { code: '42P01', message: 'relation "sessions" does not exist' };
    const mockInsert = jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: null, error: mockError })),
      })),
    }));

    (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

    const { result } = renderHook(() => useCreateSession());

    // Attempt to create session and expect error
    let thrownError: any;
    await waitFor(async () => {
      try {
        await result.current.createSession();
      } catch (err) {
        thrownError = err;
      }
    });

    // Verify it failed immediately without retry
    // The hook converts Supabase errors to Error instances with code property
    expect(thrownError).toBeDefined();
    expect(thrownError).toBeInstanceOf(Error);
    expect(thrownError.message).toBe('relation "sessions" does not exist');
    expect(thrownError.code).toBe('42P01'); // Supabase error code preserved

    // Verify it only tried ONCE (no retry)
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockGenerateSessionCode).toHaveBeenCalledTimes(1);
  });

  it('should handle edge case where data is null after collision error', async () => {
    // This tests a theoretical edge case where neither data nor error is returned
    mockGenerateSessionCode
      .mockReturnValueOnce('happy-tiger-42')
      .mockReturnValueOnce('bright-eagle-17');

    let callCount = 0;
    const mockInsert = jest.fn(() => {
      callCount++;
      if (callCount === 1) {
        // First attempt: collision
        return {
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: null,
              error: { code: '23505', message: 'duplicate key value violates unique constraint "sessions_code_key"' }
            })),
          })),
        };
      } else {
        // Second attempt: returns null for both (edge case)
        return {
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        };
      }
    });

    (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

    const { result } = renderHook(() => useCreateSession());

    // Attempt to create session and expect error
    let thrownError: Error | undefined;
    await waitFor(async () => {
      try {
        await result.current.createSession();
      } catch (err) {
        thrownError = err as Error;
      }
    });

    // Verify it failed with the correct error
    expect(thrownError).toBeDefined();
    expect(thrownError?.message).toBe('Failed to create session: no data returned');

    // Verify it tried twice (once for collision, once for null data)
    expect(mockInsert).toHaveBeenCalledTimes(2);
  });
});
