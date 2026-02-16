import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Participant, ParticipantRole } from '@/types/database.types';

export interface ParticipantWithPermission extends Participant {
  role: ParticipantRole;
  user_id: string | null;
}

interface ParticipantListState {
  participants: ParticipantWithPermission[];
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch participants with their permissions
 *
 * Returns participants sorted by:
 * 1. Owner first
 * 2. Editors next
 * 3. Viewers last
 * 4. Within each group, sorted by join time (earliest first)
 *
 * Subscribes to real-time updates for both participants and permissions
 */
export function useParticipantList(sessionId: string | null): ParticipantListState {
  const [state, setState] = useState<ParticipantListState>({
    participants: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!sessionId) {
      setState({ participants: [], loading: false, error: null });
      return;
    }

    async function fetchParticipants() {
      try {
        // Fetch session to get owner info
        const { data: session, error: sessionError } = await supabase
          .from('sessions')
          .select('user_id, created_by_device_id, default_participant_role')
          .eq('id', sessionId)
          .single();

        if (sessionError) throw sessionError;

        // Fetch all participants for this session
        const { data: participants, error: participantsError } = await supabase
          .from('participants')
          .select('*')
          .eq('session_id', sessionId)
          .order('joined_at', { ascending: true });

        if (participantsError) throw participantsError;

        // Fetch all permissions for this session
        const { data: permissions, error: permissionsError } = await supabase
          .from('participant_permissions')
          .select('*')
          .eq('session_id', sessionId);

        if (permissionsError) throw permissionsError;

        // Combine participants with their permissions
        const participantsWithPermissions: ParticipantWithPermission[] = (participants || []).map(
          (participant) => {
            // Check if this participant is the owner
            const isOwner =
              (session.user_id && participant.device_id === session.created_by_device_id) ||
              false; // Note: participants table only has device_id, need to match by device_id

            if (isOwner) {
              return {
                ...participant,
                role: 'owner' as ParticipantRole,
                user_id: session.user_id,
              };
            }

            // Find explicit permission for this participant
            const permission = permissions?.find(
              (p) =>
                p.participant_device_id === participant.device_id ||
                (p.participant_user_id && p.participant_user_id === session.user_id)
            );

            if (permission) {
              return {
                ...participant,
                role: permission.role as ParticipantRole,
                user_id: permission.participant_user_id,
              };
            }

            // Use default session role
            return {
              ...participant,
              role: session.default_participant_role as ParticipantRole,
              user_id: null,
            };
          }
        );

        // Sort participants: owner > editor > viewer, then by join time
        const roleOrder: Record<ParticipantRole, number> = {
          owner: 0,
          editor: 1,
          viewer: 2,
        };

        participantsWithPermissions.sort((a, b) => {
          const roleComparison = roleOrder[a.role] - roleOrder[b.role];
          if (roleComparison !== 0) return roleComparison;
          return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
        });

        setState({
          participants: participantsWithPermissions,
          loading: false,
          error: null,
        });
      } catch (err) {
        console.error('Error fetching participants:', err);
        setState({
          participants: [],
          loading: false,
          error: err as Error,
        });
      }
    }

    fetchParticipants();

    // Subscribe to participant changes
    const participantsChannel = supabase
      .channel(`participants:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          fetchParticipants();
        }
      )
      .subscribe();

    // Subscribe to permission changes
    const permissionsChannel = supabase
      .channel(`permissions:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participant_permissions',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          fetchParticipants();
        }
      )
      .subscribe();

    return () => {
      participantsChannel.unsubscribe();
      permissionsChannel.unsubscribe();
    };
  }, [sessionId]);

  return state;
}
