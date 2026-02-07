import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session, SessionType } from '@/types/database.types';
import { generateSessionCode } from '@/utils/sessionCode';

interface CreateSessionOptions {
  type?: SessionType;
}

/**
 * Hook for creating new whiteboard sessions
 */
export function useCreateSession() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createSession = async (
    options: CreateSessionOptions = {}
  ): Promise<Session> => {
    setIsCreating(true);
    setError(null);

    try {
      const code = generateSessionCode();
      const sessionType = options.type || 'study-group'; // Default to study group

      const { data, error: insertError } = await supabase
        .from('sessions')
        .insert([{
          code,
          session_type: sessionType,
          status: 'active',
          drawing_permissions: sessionType === 'study-group' ? 'collaborative' : 'read-only',
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      if (!data) throw new Error('Failed to create session');

      return data as Session;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  return { createSession, isCreating, error };
}
