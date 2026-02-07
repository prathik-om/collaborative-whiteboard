// Tests for useCreateSession hook
import { renderHook, waitFor } from '@testing-library/react';
import type { Session } from '@/types/database.types';

// Mock Supabase BEFORE importing anything that uses it
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock session code generator
jest.mock('@/utils/sessionCode', () => ({
  generateSessionCode: jest.fn(() => 'happy-tiger'),
}));

// Now import after mocks are set up
import { supabase } from '@/lib/supabase';
import { useCreateSession } from './useCreateSession';

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
      code: 'happy-tiger',
      session_type: 'study-group',
      status: 'active',
      drawing_permissions: 'collaborative',
      canvas_snapshot: {},
      created_at: '2026-02-07T10:00:00Z',
      ended_at: null,
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
    expect(session!.code).toBe('happy-tiger');
    expect(session!.session_type).toBe('study-group');
    expect(session!.status).toBe('active');
    expect(session!.drawing_permissions).toBe('collaborative');

    // Verify isCreating state was managed correctly
    expect(result.current.isCreating).toBe(false);
    expect(result.current.error).toBe(null);

    // Verify Supabase was called correctly
    expect(mockInsert).toHaveBeenCalledWith([{
      code: 'happy-tiger',
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
    expect(thrownError?.message).toBe('Failed to create session');

    // Verify error state was set
    await waitFor(() => {
      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe('Failed to create session');
    });

    // Verify isCreating is false after error
    expect(result.current.isCreating).toBe(false);
  });

  it('should manage loading state correctly', async () => {
    const mockData: Session = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      code: 'happy-tiger',
      session_type: 'study-group',
      status: 'active',
      drawing_permissions: 'collaborative',
      canvas_snapshot: {},
      created_at: '2026-02-07T10:00:00Z',
      ended_at: null,
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
});
