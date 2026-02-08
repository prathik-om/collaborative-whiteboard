-- Add User Authentication Support
-- Allows users to optionally save anonymous sessions to their account
-- Progressive enhancement: Anonymous by default, account optional

-- Add user_id column to sessions (nullable for anonymous sessions)
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add created_by_device_id to track original creator (for claiming anonymous sessions)
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS created_by_device_id text;

-- Add session_name for user-friendly naming (when saved to account)
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS session_name text;

-- Add is_public flag (private sessions only visible to owner)
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;

-- Create index for user session queries
CREATE INDEX IF NOT EXISTS idx_sessions_user_id
  ON sessions(user_id)
  WHERE user_id IS NOT NULL;

-- Create index for device-based queries (for claiming sessions)
CREATE INDEX IF NOT EXISTS idx_sessions_device_id
  ON sessions(created_by_device_id)
  WHERE created_by_device_id IS NOT NULL;

-- Update RLS policies to support both anonymous and authenticated sessions

-- DROP old policies
DROP POLICY IF EXISTS "Anyone can view active sessions" ON sessions;
DROP POLICY IF EXISTS "Anyone can create sessions" ON sessions;
DROP POLICY IF EXISTS "Anyone can update active session canvas" ON sessions;

-- NEW POLICY: View sessions
-- Logic: Can view if (public AND active) OR (you own it) OR (you created it anonymously)
CREATE POLICY "View sessions - public or owned"
  ON sessions FOR SELECT
  USING (
    -- Public active sessions (anonymous, anyone can see)
    (is_public = true AND status = 'active')
    OR
    -- Your authenticated sessions
    (user_id = auth.uid())
    OR
    -- Sessions you created anonymously (matched by device_id header)
    (created_by_device_id = current_setting('request.headers', true)::json->>'x-device-id')
  );

-- NEW POLICY: Create sessions (anyone can create)
CREATE POLICY "Anyone can create sessions"
  ON sessions FOR INSERT
  WITH CHECK (true);

-- NEW POLICY: Update sessions
-- Logic: Can update if (you own it) OR (it's public and active)
CREATE POLICY "Update sessions - owner or public"
  ON sessions FOR UPDATE
  USING (
    -- Public active sessions (collaborative drawing)
    (is_public = true AND status = 'active')
    OR
    -- Your authenticated sessions
    (user_id = auth.uid())
    OR
    -- Sessions you created anonymously
    (created_by_device_id = current_setting('request.headers', true)::json->>'x-device-id')
  )
  WITH CHECK (
    -- Same conditions for the updated row
    (is_public = true AND status = 'active')
    OR
    (user_id = auth.uid())
    OR
    (created_by_device_id = current_setting('request.headers', true)::json->>'x-device-id')
  );

-- NEW POLICY: Delete sessions (only owner can delete)
CREATE POLICY "Delete sessions - owner only"
  ON sessions FOR DELETE
  USING (
    user_id = auth.uid()
    OR
    (created_by_device_id = current_setting('request.headers', true)::json->>'x-device-id')
  );

-- Function: Claim anonymous session (convert to authenticated)
CREATE OR REPLACE FUNCTION claim_session(
  p_session_code text,
  p_device_id text,
  p_session_name text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get current authenticated user
  v_user_id := auth.uid();

  -- Must be authenticated to claim
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated to claim session';
  END IF;

  -- Update session to be owned by user
  UPDATE sessions
  SET
    user_id = v_user_id,
    session_name = COALESCE(p_session_name, code),
    is_public = true  -- Keep public by default
  WHERE
    code = p_session_code
    AND created_by_device_id = p_device_id
    AND user_id IS NULL;  -- Only claim unclaimed sessions

  -- Return true if a row was updated
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON COLUMN sessions.user_id IS 'User who owns this session (NULL for anonymous sessions)';
COMMENT ON COLUMN sessions.created_by_device_id IS 'Device ID of session creator (for claiming anonymous sessions)';
COMMENT ON COLUMN sessions.session_name IS 'User-friendly name for the session (defaults to code)';
COMMENT ON COLUMN sessions.is_public IS 'Whether session is publicly visible (private sessions only visible to owner)';
COMMENT ON FUNCTION claim_session IS 'Converts anonymous session to authenticated session (must match device_id)';

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
