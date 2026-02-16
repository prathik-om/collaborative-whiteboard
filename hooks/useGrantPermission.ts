import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import type { ParticipantRole } from '@/types/database.types';

interface GrantPermissionState {
  isGranting: boolean;
  error: Error | null;
}

/**
 * Hook to grant or revoke edit permissions for participants
 *
 * Only session owners can use this hook
 * Permissions are stored in the participant_permissions table
 */
export function useGrantPermission() {
  const { user } = useAuth();
  const [state, setState] = useState<GrantPermissionState>({
    isGranting: false,
    error: null,
  });

  /**
   * Grant a specific role to a participant
   *
   * @param sessionId - The session ID
   * @param deviceId - The participant's device ID
   * @param userId - The participant's user ID (if signed in)
   * @param role - The role to grant ('viewer' or 'editor')
   */
  const grantPermission = async (
    sessionId: string,
    deviceId: string | null,
    userId: string | null,
    role: ParticipantRole
  ): Promise<{ success: boolean; error: Error | null }> => {
    setState({ isGranting: true, error: null });

    try {
      // Check if permission already exists
      const { data: existing, error: checkError } = await supabase
        .from('participant_permissions')
        .select('id')
        .eq('session_id', sessionId)
        .or(
          userId
            ? `participant_user_id.eq.${userId},participant_device_id.eq.${deviceId}`
            : `participant_device_id.eq.${deviceId}`
        )
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned", which is fine
        throw checkError;
      }

      if (existing) {
        // Update existing permission
        const { error: updateError } = await supabase
          .from('participant_permissions')
          .update({
            role,
            granted_by_user_id: user?.id || null,
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;
      } else {
        // Insert new permission
        const { error: insertError } = await supabase
          .from('participant_permissions')
          .insert({
            session_id: sessionId,
            participant_device_id: deviceId,
            participant_user_id: userId,
            role,
            granted_by_user_id: user?.id || null,
          });

        if (insertError) throw insertError;
      }

      setState({ isGranting: false, error: null });
      return { success: true, error: null };
    } catch (err) {
      const error = err as Error;
      console.error('Error granting permission:', error);
      setState({ isGranting: false, error });
      return { success: false, error };
    }
  };

  /**
   * Revoke explicit permission for a participant
   * They will fall back to the session's default role
   *
   * @param sessionId - The session ID
   * @param deviceId - The participant's device ID
   * @param userId - The participant's user ID (if signed in)
   */
  const revokePermission = async (
    sessionId: string,
    deviceId: string | null,
    userId: string | null
  ): Promise<{ success: boolean; error: Error | null }> => {
    setState({ isGranting: true, error: null });

    try {
      const { error: deleteError } = await supabase
        .from('participant_permissions')
        .delete()
        .eq('session_id', sessionId)
        .or(
          userId
            ? `participant_user_id.eq.${userId},participant_device_id.eq.${deviceId}`
            : `participant_device_id.eq.${deviceId}`
        );

      if (deleteError) throw deleteError;

      setState({ isGranting: false, error: null });
      return { success: true, error: null };
    } catch (err) {
      const error = err as Error;
      console.error('Error revoking permission:', error);
      setState({ isGranting: false, error });
      return { success: false, error };
    }
  };

  return {
    grantPermission,
    revokePermission,
    isGranting: state.isGranting,
    error: state.error,
  };
}
