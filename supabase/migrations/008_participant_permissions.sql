-- Migration 008: Participant Permissions System
-- Adds granular permission controls for collaborative sessions

-- ============================================================================
-- 1. Create participant_permissions table
-- ============================================================================

CREATE TABLE IF NOT EXISTS participant_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  participant_device_id text,
  participant_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor', 'owner')),
  granted_at timestamptz DEFAULT now(),
  granted_by_user_id uuid REFERENCES auth.users(id),

  -- Ensure one permission per participant (by device_id OR user_id)
  CONSTRAINT unique_participant_permission UNIQUE NULLS NOT DISTINCT (session_id, participant_device_id, participant_user_id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_participant_permissions_session_id ON participant_permissions(session_id);
CREATE INDEX IF NOT EXISTS idx_participant_permissions_device_id ON participant_permissions(session_id, participant_device_id);
CREATE INDEX IF NOT EXISTS idx_participant_permissions_user_id ON participant_permissions(session_id, participant_user_id);

-- ============================================================================
-- 2. Add columns to sessions table
-- ============================================================================

-- Add default participant role (viewer or editor)
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS default_participant_role text
  DEFAULT 'viewer'
  CHECK (default_participant_role IN ('viewer', 'editor'));

-- Add public/private visibility flag
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS is_public boolean
  DEFAULT true;

-- Update existing sessions to have default values
UPDATE sessions
SET
  default_participant_role = 'viewer',
  is_public = true
WHERE
  default_participant_role IS NULL
  OR is_public IS NULL;

-- ============================================================================
-- 3. Create permission checking function
-- ============================================================================

CREATE OR REPLACE FUNCTION can_participant_edit(
  p_session_code text,
  p_device_id text,
  p_user_id uuid DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id uuid;
  v_created_by_device_id text;
  v_created_by_user_id uuid;
  v_permission_role text;
  v_default_role text;
  v_is_public boolean;
BEGIN
  -- Get session details
  SELECT id, created_by_device_id, user_id, default_participant_role, is_public
  INTO v_session_id, v_created_by_device_id, v_created_by_user_id, v_default_role, v_is_public
  FROM sessions
  WHERE code = p_session_code AND status = 'active';

  -- Session not found
  IF v_session_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check 1: Is this the owner? (by user_id or device_id)
  IF (p_user_id IS NOT NULL AND p_user_id = v_created_by_user_id) OR
     (p_device_id IS NOT NULL AND p_device_id = v_created_by_device_id) THEN
    RETURN true;
  END IF;

  -- Check 2: For private sessions, anonymous users cannot edit
  IF NOT v_is_public AND p_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check 3: Look for explicit permission in participant_permissions table
  -- First try user_id match (takes precedence)
  IF p_user_id IS NOT NULL THEN
    SELECT role INTO v_permission_role
    FROM participant_permissions
    WHERE session_id = v_session_id
      AND participant_user_id = p_user_id
    LIMIT 1;

    IF FOUND THEN
      RETURN v_permission_role IN ('editor', 'owner');
    END IF;
  END IF;

  -- Then try device_id match (for anonymous users or if no user_id permission found)
  IF p_device_id IS NOT NULL THEN
    SELECT role INTO v_permission_role
    FROM participant_permissions
    WHERE session_id = v_session_id
      AND participant_device_id = p_device_id
    LIMIT 1;

    IF FOUND THEN
      RETURN v_permission_role IN ('editor', 'owner');
    END IF;
  END IF;

  -- Check 4: Fall back to session default role
  RETURN v_default_role = 'editor';
END;
$$;

-- ============================================================================
-- 4. Helper function to get participant role
-- ============================================================================

CREATE OR REPLACE FUNCTION get_participant_role(
  p_session_code text,
  p_device_id text,
  p_user_id uuid DEFAULT NULL
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id uuid;
  v_created_by_device_id text;
  v_created_by_user_id uuid;
  v_permission_role text;
  v_default_role text;
BEGIN
  -- Get session details
  SELECT id, created_by_device_id, user_id, default_participant_role
  INTO v_session_id, v_created_by_device_id, v_created_by_user_id, v_default_role
  FROM sessions
  WHERE code = p_session_code AND status = 'active';

  -- Session not found
  IF v_session_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Check 1: Is this the owner?
  IF (p_user_id IS NOT NULL AND p_user_id = v_created_by_user_id) OR
     (p_device_id IS NOT NULL AND p_device_id = v_created_by_device_id) THEN
    RETURN 'owner';
  END IF;

  -- Check 2: Look for explicit permission (user_id first)
  IF p_user_id IS NOT NULL THEN
    SELECT role INTO v_permission_role
    FROM participant_permissions
    WHERE session_id = v_session_id
      AND participant_user_id = p_user_id
    LIMIT 1;

    IF FOUND THEN
      RETURN v_permission_role;
    END IF;
  END IF;

  -- Check 3: Look for device_id permission
  IF p_device_id IS NOT NULL THEN
    SELECT role INTO v_permission_role
    FROM participant_permissions
    WHERE session_id = v_session_id
      AND participant_device_id = p_device_id
    LIMIT 1;

    IF FOUND THEN
      RETURN v_permission_role;
    END IF;
  END IF;

  -- Check 4: Return default role
  RETURN v_default_role;
END;
$$;

-- ============================================================================
-- 5. RLS Policies for participant_permissions table
-- ============================================================================

-- Enable RLS
ALTER TABLE participant_permissions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone can view permissions for sessions they have access to
CREATE POLICY "View permissions if in session"
  ON participant_permissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = participant_permissions.session_id
        AND sessions.status = 'active'
    )
  );

-- Policy 2: Only session owner can insert permissions
CREATE POLICY "Owner can grant permissions"
  ON participant_permissions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = participant_permissions.session_id
        AND (
          sessions.user_id = auth.uid()
          OR sessions.created_by_device_id = current_setting('request.headers', true)::json->>'x-device-id'
        )
    )
  );

-- Policy 3: Only session owner can update permissions
CREATE POLICY "Owner can update permissions"
  ON participant_permissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = participant_permissions.session_id
        AND (
          sessions.user_id = auth.uid()
          OR sessions.created_by_device_id = current_setting('request.headers', true)::json->>'x-device-id'
        )
    )
  );

-- Policy 4: Only session owner can delete permissions
CREATE POLICY "Owner can delete permissions"
  ON participant_permissions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = participant_permissions.session_id
        AND (
          sessions.user_id = auth.uid()
          OR sessions.created_by_device_id = current_setting('request.headers', true)::json->>'x-device-id'
        )
    )
  );

-- ============================================================================
-- 6. Notify PostgREST to reload schema
-- ============================================================================

NOTIFY pgrst, 'reload schema';
