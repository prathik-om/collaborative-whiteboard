-- Realtime Setup
-- Enable Supabase Realtime for sessions and participants tables

-- Enable realtime for sessions table
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;

-- Enable realtime for participants table
ALTER PUBLICATION supabase_realtime ADD TABLE participants;

-- Note: After running this migration, you must also:
-- 1. Go to Supabase Dashboard → Database → Replication
-- 2. Enable Realtime for 'sessions' table
-- 3. Enable Realtime for 'participants' table
--
-- This enables real-time updates via Supabase Realtime subscriptions
