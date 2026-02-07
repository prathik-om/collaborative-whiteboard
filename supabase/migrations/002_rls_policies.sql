-- Row Level Security Policies
-- Everyone can view and join sessions (anonymous access)

-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Sessions: Anyone can view active sessions
CREATE POLICY "Anyone can view sessions"
  ON sessions FOR SELECT
  USING (true);

-- Sessions: Anyone can create sessions (anonymous whiteboard creation)
CREATE POLICY "Anyone can create sessions"
  ON sessions FOR INSERT
  WITH CHECK (true);

-- Sessions: Allow updates to canvas snapshot (for collaborative drawing)
CREATE POLICY "Anyone can update session canvas"
  ON sessions FOR UPDATE
  USING (status = 'active')
  WITH CHECK (status = 'active');

-- Participants: Anyone can view participants in a session
CREATE POLICY "Anyone can view participants"
  ON participants FOR SELECT
  USING (true);

-- Participants: Anyone can join a session (add themselves as participant)
CREATE POLICY "Anyone can join sessions"
  ON participants FOR INSERT
  WITH CHECK (true);

-- Participants: Users can update their own participant record (last_seen, nickname)
CREATE POLICY "Users can update their own participant record"
  ON participants FOR UPDATE
  USING (
    device_id = current_setting('request.headers', true)::json->>'x-device-id'
  );

-- Note: We use device_id from request headers for anonymous identification
-- This is set by the client and passed via Supabase client headers
