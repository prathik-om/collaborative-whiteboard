// Test fixtures for session-related tests
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
  ended_at: null,
  last_activity_at: '2026-02-07T10:00:00Z',
  user_id: null,
  created_by_device_id: 'device_123',
  session_name: null,
  is_public: true,
};

export const mockBroadcastMessage: BroadcastMessage = {
  type: 'canvas_update',
  payload: {
    shapes: [{ id: '1', type: 'rectangle', x: 0, y: 0 }],
  },
};
