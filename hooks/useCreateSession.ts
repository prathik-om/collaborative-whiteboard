import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session, SessionType } from '@/types/database.types';
import { generateSessionCode } from '@/utils/sessionCode';
import { getDeviceId } from '@/utils/deviceId';
import { SessionStorageManager } from '@/utils/sessionStorage';

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
      const sessionType = options.type || 'study-group'; // Default to study group
      let attempts = 0;
      const maxAttempts = 5;

      // Get device ID for tracking session ownership
      const deviceId = getDeviceId();

      // Retry logic for handling session code collisions
      while (attempts < maxAttempts) {
        const code = generateSessionCode();

        const { data, error: insertError } = await supabase
          .from('sessions')
          .insert([{
            code,
            session_type: sessionType,
            status: 'active',
            drawing_permissions: sessionType === 'study-group' ? 'collaborative' : 'read-only',
            created_by_device_id: deviceId,
          }])
          .select()
          .single();

        // If successful, auto-save to localStorage and return the session
        if (!insertError && data) {
          // Auto-save to localStorage for anonymous users
          SessionStorageManager.saveSession({
            code: data.code,
            sessionName: data.session_name,
            lastAccessed: Date.now(),
            createdAt: new Date(data.created_at).getTime(),
            createdByThisDevice: true, // This session was created by this device
            sessionType: data.session_type,
          });

          return data as Session;
        }

        // If it's a unique constraint violation (duplicate code), retry with a new code
        if (insertError?.code === '23505') {
          attempts++;
          console.warn(`[useCreateSession] Code collision (attempt ${attempts}/${maxAttempts}), retrying with new code...`);
          continue;
        }

        // For any other error, throw immediately
        if (insertError) {
          console.error('[useCreateSession] Supabase error:', insertError);
          console.error('[useCreateSession] Error code:', insertError.code);
          console.error('[useCreateSession] Error message:', insertError.message);

          // Convert Supabase error to Error instance to preserve error information
          const error = new Error(insertError.message || 'Database error');
          // Preserve Supabase error code and details as properties
          (error as any).code = insertError.code;
          (error as any).details = insertError.details;
          throw error;
        }

        // This shouldn't happen, but handle the case where data is null without error
        throw new Error('Failed to create session: no data returned');
      }

      // If we exhausted all retry attempts
      throw new Error(`Failed to generate unique session code after ${maxAttempts} attempts`);
    } catch (err) {
      console.error('[useCreateSession] Caught error:', err);
      // Ensure we always have an Error instance
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  return { createSession, isCreating, error };
}
