import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { getDeviceId } from '@/utils/deviceId';
import type { Session, ParticipantRole } from '@/types/database.types';

interface ParticipantPermissionState {
  canEdit: boolean;
  isOwner: boolean;
  role: ParticipantRole | null;
  loading: boolean;
}

/**
 * Hook to check if the current user/device can edit the session
 *
 * Permissions hierarchy:
 * 1. Owner (session creator) - always can edit
 * 2. Explicit permission in participant_permissions table
 * 3. Session default_participant_role
 *
 * Subscribes to real-time permission changes
 */
export function useParticipantPermission(session: Session | null): ParticipantPermissionState {
  const { user } = useAuth();
  const [state, setState] = useState<ParticipantPermissionState>({
    canEdit: false,
    isOwner: false,
    role: null,
    loading: true,
  });

  useEffect(() => {
    if (!session) {
      setState({ canEdit: false, isOwner: false, role: null, loading: false });
      return;
    }

    const deviceId = getDeviceId();
    const userId = user?.id || null;

    // Check if this user/device is the owner
    const isOwner =
      (userId && userId === session.user_id) ||
      (deviceId && deviceId === session.created_by_device_id);

    // If owner, no need to check permissions
    if (isOwner) {
      setState({ canEdit: true, isOwner: true, role: 'owner', loading: false });
      return;
    }

    async function checkPermission() {
      if (!session) return; // Additional safety check for TypeScript

      try {
        // Call the SQL function to get participant role
        const { data: roleData, error: roleError } = await supabase
          .rpc('get_participant_role', {
            p_session_code: session.code,
            p_device_id: deviceId,
            p_user_id: userId,
          });

        if (roleError) {
          console.error('Error checking permission:', roleError);
          setState({ canEdit: false, isOwner: false, role: null, loading: false });
          return;
        }

        const role = roleData as ParticipantRole | null;
        const canEdit = role === 'editor' || role === 'owner';

        setState({
          canEdit,
          isOwner: false,
          role,
          loading: false,
        });
      } catch (err) {
        console.error('Error in checkPermission:', err);
        setState({ canEdit: false, isOwner: false, role: null, loading: false });
      }
    }

    checkPermission();

    // Subscribe to real-time permission changes
    const channel = supabase
      .channel(`session_permissions:${session.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participant_permissions',
          filter: `session_id=eq.${session.id}`,
        },
        () => {
          // Re-check permissions when they change
          checkPermission();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [session, user]);

  return state;
}
