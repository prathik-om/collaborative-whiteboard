-- Update RLS Policies to Filter Inactive Sessions
-- Only show 'active' sessions to users (hide 'inactive', 'ended', etc.)
-- This works with the cleanup system to keep the UI clean

-- Drop the old policy that allowed viewing all sessions
DROP POLICY IF EXISTS "Anyone can view sessions" ON sessions;

-- Create new policy that only shows active sessions
CREATE POLICY "Anyone can view active sessions"
  ON sessions FOR SELECT
  USING (status = 'active');

-- Update the canvas update policy to be more explicit
-- (This was already filtering active sessions, but let's be consistent)
DROP POLICY IF EXISTS "Anyone can update session canvas" ON sessions;

CREATE POLICY "Anyone can update active session canvas"
  ON sessions FOR UPDATE
  USING (status = 'active')
  WITH CHECK (status = 'active');

-- Comment for documentation
COMMENT ON POLICY "Anyone can view active sessions" ON sessions IS
  'Users can only see active sessions. Inactive/ended sessions are hidden from queries.';

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
