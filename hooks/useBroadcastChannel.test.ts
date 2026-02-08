// Tests for useBroadcastChannel hook
import { renderHook, waitFor } from '@testing-library/react';
import type { BroadcastMessage } from '@/hooks/useBroadcastChannel';

// Mock Supabase BEFORE importing
const mockOn = jest.fn();
const mockSubscribe = jest.fn();
const mockUnsubscribe = jest.fn();
const mockSend = jest.fn();

const mockChannel = {
  on: mockOn,
  subscribe: mockSubscribe,
  unsubscribe: mockUnsubscribe,
  send: mockSend,
};

jest.mock('@/lib/supabase', () => ({
  supabase: {
    channel: jest.fn(() => mockChannel),
  },
}));

// Now import after mocks
import { supabase } from '@/lib/supabase';
import { useBroadcastChannel } from './useBroadcastChannel';

describe('useBroadcastChannel', () => {
  const mockOnMessage = jest.fn();
  const testSessionCode = 'happy-tiger';

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mock chain
    mockOn.mockReturnValue(mockChannel);
    mockSubscribe.mockImplementation((callback) => {
      // Simulate successful subscription
      setTimeout(() => callback('SUBSCRIBED'), 0);
      return mockChannel;
    });
  });

  it('should initialize with disconnected state', () => {
    const { result } = renderHook(() =>
      useBroadcastChannel({
        sessionCode: testSessionCode,
        onMessage: mockOnMessage,
      })
    );

    expect(result.current.isConnected).toBe(false);
    expect(typeof result.current.broadcast).toBe('function');
  });

  it('should create channel with correct session code', () => {
    renderHook(() =>
      useBroadcastChannel({
        sessionCode: testSessionCode,
        onMessage: mockOnMessage,
      })
    );

    expect(supabase.channel).toHaveBeenCalledWith(
      'session:happy-tiger',
      expect.objectContaining({
        config: {
          broadcast: {
            self: false,
            ack: false,
          },
        },
      })
    );
  });

  it('should subscribe to broadcast events', () => {
    renderHook(() =>
      useBroadcastChannel({
        sessionCode: testSessionCode,
        onMessage: mockOnMessage,
      })
    );

    expect(mockOn).toHaveBeenCalledWith(
      'broadcast',
      { event: 'message' },
      expect.any(Function)
    );
    expect(mockSubscribe).toHaveBeenCalled();
  });

  it('should update connection status when subscribed', async () => {
    const { result } = renderHook(() =>
      useBroadcastChannel({
        sessionCode: testSessionCode,
        onMessage: mockOnMessage,
      })
    );

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  it('should handle message receiving', async () => {
    const testMessage: BroadcastMessage = {
      type: 'canvas_update',
      payload: { test: 'data' },
    };

    // Capture the message handler
    let messageHandler: ((payload: any) => void) | undefined;
    mockOn.mockImplementation((event, config, handler) => {
      messageHandler = handler;
      return mockChannel;
    });

    renderHook(() =>
      useBroadcastChannel({
        sessionCode: testSessionCode,
        onMessage: mockOnMessage,
      })
    );

    // Wait for subscription
    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalled();
    });

    // Simulate receiving message
    if (messageHandler) {
      messageHandler({ payload: testMessage });
    }

    await waitFor(() => {
      expect(mockOnMessage).toHaveBeenCalledWith(testMessage);
    });
  });

  it('should broadcast message when connected', async () => {
    const { result } = renderHook(() =>
      useBroadcastChannel({
        sessionCode: testSessionCode,
        onMessage: mockOnMessage,
      })
    );

    // Wait for connection
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    const testMessage: BroadcastMessage = {
      type: 'canvas_update',
      payload: { shapes: [] },
    };

    result.current.broadcast(testMessage);

    expect(mockSend).toHaveBeenCalledWith({
      type: 'broadcast',
      event: 'message',
      payload: testMessage,
    });
  });

  it('should not broadcast when disconnected', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    const { result } = renderHook(() =>
      useBroadcastChannel({
        sessionCode: testSessionCode,
        onMessage: mockOnMessage,
      })
    );

    // Try to broadcast before connection
    const testMessage: BroadcastMessage = {
      type: 'test',
      payload: {},
    };

    result.current.broadcast(testMessage);

    expect(mockSend).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Cannot broadcast: channel not connected'
    );

    consoleSpy.mockRestore();
  });

  it('should unsubscribe on unmount', () => {
    const { unmount } = renderHook(() =>
      useBroadcastChannel({
        sessionCode: testSessionCode,
        onMessage: mockOnMessage,
      })
    );

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should handle empty session code', () => {
    const { result } = renderHook(() =>
      useBroadcastChannel({
        sessionCode: '',
        onMessage: mockOnMessage,
      })
    );

    expect(result.current.isConnected).toBe(false);
    expect(supabase.channel).not.toHaveBeenCalled();
  });

  it('should resubscribe when session code changes', async () => {
    const { result, rerender } = renderHook(
      ({ sessionCode }) =>
        useBroadcastChannel({
          sessionCode,
          onMessage: mockOnMessage,
        }),
      { initialProps: { sessionCode: 'session-1' } }
    );

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    // Change session code
    rerender({ sessionCode: 'session-2' });

    // Should unsubscribe from old channel
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);

    // Should subscribe to new channel
    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalledWith(
        'session:session-2',
        expect.any(Object)
      );
    });
  });
});
