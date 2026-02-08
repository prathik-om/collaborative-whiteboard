import { useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook to claim an anonymous session (convert to authenticated)
 */
export function useClaimSession() {
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const claimSession = async (sessionCode: string, deviceId: string, sessionName?: string) => {
    setIsClaiming(true);
    setError(null);

    try {
      // Call the claim_session database function
      const { data, error } = await supabase.rpc('claim_session', {
        p_session_code: sessionCode,
        p_device_id: deviceId,
        p_session_name: sessionName || sessionCode,
      });

      if (error) throw error;

      if (!data) {
        throw new Error('Failed to claim session. Make sure you created this session.');
      }

      return { success: true };
    } catch (err) {
      console.error('Error claiming session:', err);
      const error = err instanceof Error ? err : new Error('Failed to claim session');
      setError(error);
      return { success: false, error };
    } finally {
      setIsClaiming(false);
    }
  };

  return { claimSession, isClaiming, error };
}
