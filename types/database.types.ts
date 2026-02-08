// Database types for Supabase

export type SessionType = 'classroom' | 'study-group' | 'individual';
export type DrawingPermissions = 'read-only' | 'collaborative';
export type SessionStatus = 'active' | 'paused' | 'ended' | 'inactive';

export interface Session {
  id: string;
  code: string;
  session_type: SessionType;
  drawing_permissions: DrawingPermissions;
  status: SessionStatus;
  canvas_snapshot: Record<string, unknown> | null;
  created_at: string;
  ended_at: string | null;
  last_activity_at: string | null;
  // Authentication fields (added in migration 006)
  user_id: string | null;
  created_by_device_id: string | null;
  session_name: string | null;
  is_public: boolean;
}

export interface Participant {
  id: string;
  session_id: string;
  device_id: string;
  nickname: string | null;
  joined_at: string;
  last_seen: string;
}

export interface SessionHistory {
  id: string;
  user_id: string;
  session_id: string;
  session_code: string;
  first_accessed_at: string;
  last_accessed_at: string;
  access_count: number;
  session_name: string | null;
  session_type: SessionType | null;
}

// Supabase Auth User type
export interface User {
  id: string;
  email: string;
  email_confirmed_at?: string;
  created_at: string;
  updated_at: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
  };
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
      session_history: {
        Row: SessionHistory;
        Insert: Omit<SessionHistory, 'id' | 'first_accessed_at' | 'last_accessed_at' | 'access_count'> & {
          id?: string;
          first_accessed_at?: string;
          last_accessed_at?: string;
          access_count?: number;
        };
        Update: Partial<SessionHistory>;
      };
    };
  };
}
