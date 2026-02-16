// Tests for board page
import { render, screen, waitFor } from '@testing-library/react';
import type { Session } from '@/types/database.types';

// Mock Next.js navigation BEFORE imports
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock hooks BEFORE imports
jest.mock('@/hooks/useCreateSession', () => ({
  useCreateSession: jest.fn(),
}));

// Mock WhiteboardCanvas component BEFORE imports
jest.mock('@/components/WhiteboardCanvas', () => {
  return function MockWhiteboardCanvas({ session }: { session: Session }) {
    return <div data-testid="whiteboard-canvas">Canvas for {session.code}</div>;
  };
});

// Now import after all mocks
import { useRouter, useSearchParams } from 'next/navigation';
import { useCreateSession } from '@/hooks/useCreateSession';
import BoardPage from '../page';

describe('BoardPage', () => {
  const mockPush = jest.fn();
  const mockCreateSession = jest.fn();

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
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
    (useCreateSession as jest.Mock).mockReturnValue({
      createSession: mockCreateSession,
      isCreating: false,
      error: null,
    });
  });

  it('should show loading state initially', () => {
    (useCreateSession as jest.Mock).mockReturnValue({
      createSession: mockCreateSession,
      isCreating: true,
      error: null,
    });

    render(<BoardPage />);
    expect(screen.getByText(/Creating your whiteboard/)).toBeInTheDocument();
  });

  it('should create new session when no code in URL', async () => {
    mockCreateSession.mockResolvedValue(mockSession);

    render(<BoardPage />);

    await waitFor(() => {
      expect(mockCreateSession).toHaveBeenCalledWith({ type: 'study-group' });
    });
  });

  it('should redirect to board with session code after creation', async () => {
    mockCreateSession.mockResolvedValue(mockSession);

    render(<BoardPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/board?code=happy-tiger', {
        scroll: false,
      });
    });
  });

  it('should render canvas when session is ready', async () => {
    mockCreateSession.mockResolvedValue(mockSession);

    render(<BoardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('whiteboard-canvas')).toBeInTheDocument();
      expect(screen.getByText('Canvas for happy-tiger')).toBeInTheDocument();
    });
  });

  it('should display session code in header', async () => {
    mockCreateSession.mockResolvedValue(mockSession);

    render(<BoardPage />);

    await waitFor(() => {
      expect(screen.getByText('happy-tiger')).toBeInTheDocument();
      expect(screen.getByText('Session Code')).toBeInTheDocument();
    });
  });

  it('should show copy link button', async () => {
    mockCreateSession.mockResolvedValue(mockSession);

    render(<BoardPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Copy Link/i })).toBeInTheDocument();
    });
  });

  it('should handle session creation error', async () => {
    mockCreateSession.mockRejectedValue(new Error('Database error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(<BoardPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to create whiteboard session')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('should show go home button on error', async () => {
    mockCreateSession.mockRejectedValue(new Error('Database error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(<BoardPage />);

    await waitFor(() => {
      const homeButton = screen.getByRole('button', { name: /Go Home/i });
      expect(homeButton).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('should load existing session when code in URL', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams('code=happy-tiger')
    );

    render(<BoardPage />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Loading session:', 'happy-tiger');
    });

    // Should not create new session
    expect(mockCreateSession).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
