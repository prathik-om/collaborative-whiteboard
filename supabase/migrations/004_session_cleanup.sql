-- Session Cleanup System
-- Automatically marks old sessions as inactive and deletes them after retention period
-- This prevents session code collisions from accumulating over time

-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Add last_activity_at column to track when sessions were last used
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz DEFAULT now();

-- Update the status constraint to include 'inactive'
ALTER TABLE sessions
  DROP CONSTRAINT IF EXISTS sessions_status_check;

ALTER TABLE sessions
  ADD CONSTRAINT sessions_status_check
  CHECK (status IN ('active', 'paused', 'ended', 'inactive'));

-- Create index on last_activity_at for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity
  ON sessions(last_activity_at)
  WHERE status = 'active';

-- Function: Mark sessions inactive after 24 hours of no activity
CREATE OR REPLACE FUNCTION mark_inactive_sessions()
RETURNS void AS $$
BEGIN
  UPDATE sessions
  SET status = 'inactive'
  WHERE status = 'active'
    AND last_activity_at < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Function: Delete inactive sessions after 7 days (data retention)
CREATE OR REPLACE FUNCTION delete_old_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM sessions
  WHERE status = 'inactive'
    AND last_activity_at < now() - interval '7 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule daily cleanup to mark inactive sessions
-- Runs every day at 2:00 AM UTC
SELECT cron.schedule(
  'mark-inactive-sessions',  -- Job name
  '0 2 * * *',               -- Cron expression: daily at 2 AM
  'SELECT mark_inactive_sessions();'
);

-- Schedule weekly cleanup to delete old sessions
-- Runs every Sunday at 3:00 AM UTC
SELECT cron.schedule(
  'delete-old-sessions',     -- Job name
  '0 3 * * 0',               -- Cron expression: Sunday at 3 AM
  'SELECT delete_old_sessions();'
);

-- Comments for documentation
COMMENT ON COLUMN sessions.last_activity_at IS 'Last time session had activity (canvas updates). Used for auto-cleanup.';
COMMENT ON FUNCTION mark_inactive_sessions() IS 'Marks sessions as inactive after 24 hours of no activity. Runs daily via cron.';
COMMENT ON FUNCTION delete_old_sessions() IS 'Deletes inactive sessions after 7 days (data retention). Runs weekly via cron.';

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
