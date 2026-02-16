// Tests for WhiteboardCanvas component
import { render, screen, waitFor } from '@testing-library/react';
import type { Session } from '@/types/database.types';
import type { Editor, TLRecord } from '@tldraw/tldraw';

// Mock broadcast hook BEFORE imports
const mockBroadcast = jest.fn();
jest.mock('@/hooks/useBroadcastChannel', () => ({
  useBroadcastChannel: jest.fn(() => ({
    broadcast: mockBroadcast,
    isConnected: true,
  })),
}));

// Mock tldraw BEFORE imports
const mockEditor = {
  store: {
    mergeRemoteChanges: jest.fn((fn: () => void) => fn()),
    put: jest.fn(),
    listen: jest.fn(() => jest.fn()),
  },
};

jest.mock('@tldraw/tldraw', () => ({
  Tldraw: ({ onMount }: { onMount: (editor: Editor) => void }) => {
    // Simulate editor mount
    if (onMount) {
      setTimeout(() => onMount(mockEditor as unknown as Editor), 0);
    }
    return <div data-testid="tldraw-canvas">Tldraw Canvas</div>;
  },
  Editor: {} as any,
  TLRecord: {} as any,
}));

// Now import after mocks
import WhiteboardCanvas from '../WhiteboardCanvas';
import { useBroadcastChannel } from '@/hooks/useBroadcastChannel';

describe('WhiteboardCanvas', () => {
  const mockSession: Session = {
    id: '123',
    code: 'happy-tiger',
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

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset default mock implementation
    (useBroadcastChannel as jest.Mock).mockReturnValue({
      broadcast: mockBroadcast,
      isConnected: true,
    });

    // Reset editor mock
    mockEditor.store.listen.mockClear();
    mockEditor.store.mergeRemoteChanges.mockClear();
    mockEditor.store.put.mockClear();
  });

  it('should render tldraw canvas', () => {
    render(<WhiteboardCanvas session={mockSession} />);
    expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument();
  });

  it('should show connected status when connected', () => {
    render(<WhiteboardCanvas session={mockSession} />);
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('should show connecting status when not connected', () => {
    (useBroadcastChannel as jest.Mock).mockReturnValue({
      broadcast: mockBroadcast,
      isConnected: false,
    });

    render(<WhiteboardCanvas session={mockSession} />);
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('should display participant count', () => {
    render(<WhiteboardCanvas session={mockSession} />);
    expect(screen.getByText(/1 user/)).toBeInTheDocument();
  });

  it('should initialize broadcast channel with session code', () => {
    render(<WhiteboardCanvas session={mockSession} />);

    expect(useBroadcastChannel).toHaveBeenCalledWith({
      sessionCode: 'happy-tiger',
      onMessage: expect.any(Function),
    });
  });

  it('should mount editor and log', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    render(<WhiteboardCanvas session={mockSession} />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Editor mounted');
    });

    consoleSpy.mockRestore();
  });

  it('should pass onMessage callback to broadcast channel', () => {
    render(<WhiteboardCanvas session={mockSession} />);

    // Verify onMessage callback was provided
    const callArgs = (useBroadcastChannel as jest.Mock).mock.calls[0][0];
    expect(callArgs.onMessage).toBeDefined();
    expect(typeof callArgs.onMessage).toBe('function');
  });

  it('should render without canvas snapshot', () => {
    render(<WhiteboardCanvas session={mockSession} />);
    expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument();
  });

  it('should render with canvas snapshot', () => {
    const testSnapshot = [{ id: 'shape1', type: 'geo' }] as TLRecord[];
    const sessionWithSnapshot: Session = {
      ...mockSession,
      canvas_snapshot: testSnapshot as any,
    };

    render(<WhiteboardCanvas session={sessionWithSnapshot} />);
    expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument();
  });

  it('should handle editor initialization', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    render(<WhiteboardCanvas session={mockSession} />);

    // Editor should be mounted
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Editor mounted');
    });

    consoleSpy.mockRestore();
  });
});
