'use client';

import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from './useUser';
import { SessionStorageManager } from '@/utils/sessionStorage';
import type { Session } from '@/types/database.types';

/**
 * Hook to auto-save session metadata when user creates or joins a session
 * - Authenticated users: Save to database (session_history table)
 * - Anonymous users: Save to localStorage
 */
export function useSaveSession(session: Session | null) {
  const { user } = useUser();

  /**
   * Save session metadata
   * Called automatically when session prop changes
   */
  const saveSessionMetadata = useCallback(
    async (sessionToSave: Session) => {
      try {
        if (user) {
          // Authenticated: Save to database using RPC function
          const { error } = await supabase.rpc('record_session_access', {
            p_session_code: sessionToSave.code,
            p_user_id: user.id,
          });

          if (error) {
            console.error('Failed to record session access:', error);
            // Don't throw - this is a non-critical operation
          }
        } else {
          // Anonymous: Save to localStorage
          SessionStorageManager.saveSession({
            code: sessionToSave.code,
            sessionName: sessionToSave.session_name,
            lastAccessed: Date.now(),
            createdAt: new Date(sessionToSave.created_at).getTime(),
            createdByThisDevice: false, // Assume not created by this device (will be overridden in useCreateSession)
            sessionType: sessionToSave.session_type,
          });
        }
      } catch (err) {
        console.error('Failed to save session metadata:', err);
        // Don't throw - this is a non-critical operation
      }
    },
    [user]
  );

  // Auto-save when session changes
  useEffect(() => {
    if (session) {
      saveSessionMetadata(session);
    }
  }, [session, saveSessionMetadata]);

  return {
    saveSessionMetadata,
  };
}
