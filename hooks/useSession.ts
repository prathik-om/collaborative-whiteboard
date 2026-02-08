import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@/types/database.types';

/**
 * Hook to fetch and subscribe to a session by code
 */
export function useSession(sessionCode: string | null) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sessionCode) {
      setLoading(false);
      return;
    }

    async function fetchSession() {
      try {
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('code', sessionCode)
          .single();

        if (error) throw error;
        setSession(data);
      } catch (err) {
        console.error('Error fetching session:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, [sessionCode]);

  return { session, loading, error };
}
