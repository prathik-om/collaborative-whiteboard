'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { SessionStorageManager } from '@/utils/sessionStorage';
import { getDeviceId } from '@/utils/deviceId';

/**
 * Migration result
 */
export interface MigrationResult {
  migrated: number; // Total sessions migrated to history
  failed: number; // Sessions that failed to migrate
  claimed: number; // Sessions claimed as owned
}

/**
 * Hook to migrate localStorage sessions to database on signup
 * Should be called once after user creates an account
 */
export function useMigrateLocalSessions() {
  const [isMigrating, setIsMigrating] = useState(false);

  /**
   * Migrate all localStorage sessions to authenticated account
   * 1. Claim sessions created by this device (convert to owned)
   * 2. Add all sessions to session_history
   * 3. Clear localStorage on success
   */
  const migrateToAccount = useCallback(async (): Promise<MigrationResult> => {
    setIsMigrating(true);

    const result: MigrationResult = {
      migrated: 0,
      failed: 0,
      claimed: 0,
    };

    try {
      // Load all sessions from localStorage
      const localSessions = SessionStorageManager.loadSessions();

      if (localSessions.length === 0) {
        return result;
      }

      const deviceId = getDeviceId();

      // Process each session
      for (const session of localSessions) {
        try {
          // If created by this device, try to claim it
          if (session.createdByThisDevice && deviceId) {
            const { data: claimed, error: claimError } = await supabase.rpc('claim_session', {
              p_session_code: session.code,
              p_device_id: deviceId,
              p_session_name: session.sessionName || session.code,
            });

            if (!claimError && claimed) {
              result.claimed++;
            }

            // Small delay to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 100));
          }

          // Add to session history (works for both owned and joined sessions)
          const { error: historyError } = await supabase.rpc('record_session_access', {
            p_session_code: session.code,
          });

          if (historyError) {
            console.error(`Failed to add session ${session.code} to history:`, historyError);
            result.failed++;
          } else {
            result.migrated++;
          }

          // Small delay between migrations
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (err) {
          console.error(`Failed to migrate session ${session.code}:`, err);
          result.failed++;
        }
      }

      // Clear localStorage if at least one session was migrated
      if (result.migrated > 0) {
        SessionStorageManager.clearAll();
      }

      return result;
    } catch (err) {
      console.error('Migration failed:', err);
      throw err;
    } finally {
      setIsMigrating(false);
    }
  }, []);

  return {
    migrateToAccount,
    isMigrating,
  };
}
