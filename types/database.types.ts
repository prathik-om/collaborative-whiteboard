// Database types for Supabase

export type SessionType = 'classroom' | 'study-group' | 'individual';
export type DrawingPermissions = 'read-only' | 'collaborative';
export type SessionStatus = 'active' | 'paused' | 'ended';

export interface Session {
  id: string;
  code: string;
  session_type: SessionType;
  drawing_permissions: DrawingPermissions;
  status: SessionStatus;
  canvas_snapshot: Record<string, unknown> | null;
  created_at: string;
  ended_at: string | null;
}

export interface Participant {
  id: string;
  session_id: string;
  device_id: string;
  nickname: string | null;
  joined_at: string;
  last_seen: string;
}

export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: Session;
        Insert: Omit<Session, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Session>;
      };
      participants: {
        Row: Participant;
        Insert: Omit<Participant, 'id' | 'joined_at' | 'last_seen'> & {
          id?: string;
          joined_at?: string;
          last_seen?: string;
        };
        Update: Partial<Participant>;
      };
    };
  };
}
