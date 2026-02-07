-- Initial Database Schema for Collaborative Whiteboard
-- Creates core tables: sessions and participants

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sessions table: Stores whiteboard sessions
CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text UNIQUE NOT NULL,
  session_type text NOT NULL DEFAULT 'study-group'
    CHECK (session_type IN ('classroom', 'study-group', 'individual')),
  drawing_permissions text NOT NULL DEFAULT 'collaborative'
    CHECK (drawing_permissions IN ('read-only', 'collaborative')),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'ended')),
  canvas_snapshot jsonb,
  created_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

-- Participants table: Tracks who's in each session
CREATE TABLE participants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  nickname text,
  joined_at timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),
  UNIQUE(session_id, device_id)
);

-- Indexes for performance
CREATE INDEX idx_sessions_code ON sessions(code);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_participants_session_id ON participants(session_id);
CREATE INDEX idx_participants_device_id ON participants(device_id);

-- Auto-set study groups to collaborative
CREATE OR REPLACE FUNCTION set_default_permissions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.session_type = 'study-group' THEN
    NEW.drawing_permissions := 'collaborative';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_session_defaults
  BEFORE INSERT ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION set_default_permissions();

-- Update last_seen timestamp automatically
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_participant_last_seen
  BEFORE UPDATE ON participants
  FOR EACH ROW
  EXECUTE FUNCTION update_last_seen();

-- Comments for documentation
COMMENT ON TABLE sessions IS 'Whiteboard sessions with real-time collaboration';
COMMENT ON TABLE participants IS 'Participants in whiteboard sessions (anonymous via device ID)';
COMMENT ON COLUMN sessions.session_type IS 'Type: classroom (teacher-led), study-group (peer collaboration), individual (solo)';
COMMENT ON COLUMN sessions.drawing_permissions IS 'Who can draw: read-only or collaborative';
COMMENT ON COLUMN sessions.canvas_snapshot IS 'tldraw snapshot (JSONB) for late-joiner recovery';
