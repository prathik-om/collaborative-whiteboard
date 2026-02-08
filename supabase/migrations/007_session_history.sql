-- Migration 007: Session History Tracking
-- Enable session persistence for authenticated users
-- Tracks session access history, timestamps, and metadata

-- Create session_history table
CREATE TABLE IF NOT EXISTS session_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  session_code text NOT NULL,

  -- Tracking
  first_accessed_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now(),
  access_count integer DEFAULT 1,

  -- Metadata snapshot (for display)
  session_name text,
  session_type text,

  UNIQUE(user_id, session_id)
);

-- Indexes for fast queries
CREATE INDEX idx_session_history_user_id ON session_history(user_id);
CREATE INDEX idx_session_history_last_accessed ON session_history(user_id, last_accessed_at DESC);

-- Enable RLS
ALTER TABLE session_history ENABLE ROW LEVEL SECURITY;

-- RLS: Users see only their own history
CREATE POLICY "Users view own history" ON session_history FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own history" ON session_history FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own history" ON session_history FOR UPDATE
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Helper function: Record session access (upsert)
CREATE OR REPLACE FUNCTION record_session_access(
  p_session_code text,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS void AS $$
DECLARE
  v_session sessions;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated';
  END IF;

  SELECT * INTO v_session FROM sessions WHERE code = p_session_code LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found: %', p_session_code;
  END IF;

  INSERT INTO session_history (
    user_id, session_id, session_code, session_name, session_type
  )
  VALUES (
    p_user_id, v_session.id, v_session.code, v_session.session_name, v_session.session_type
  )
  ON CONFLICT (user_id, session_id) DO UPDATE SET
    last_accessed_at = now(),
    access_count = session_history.access_count + 1,
    session_name = COALESCE(EXCLUDED.session_name, session_history.session_name),
    session_type = COALESCE(EXCLUDED.session_type, session_history.session_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
