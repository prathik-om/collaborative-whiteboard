'use client';

import { useState } from 'react';
import { useParticipantList } from '@/hooks/useParticipantList';
import { useGrantPermission } from '@/hooks/useGrantPermission';
import type { ParticipantRole } from '@/types/database.types';

interface ParticipantListProps {
  sessionId: string;
  isOwner: boolean;
}

export default function ParticipantList({ sessionId, isOwner }: ParticipantListProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { participants, loading } = useParticipantList(sessionId);
  const { grantPermission, isGranting } = useGrantPermission();

  const handleRoleChange = async (
    participantId: string,
    deviceId: string,
    userId: string | null,
    newRole: ParticipantRole
  ) => {
    if (!isOwner || newRole === 'owner') return; // Can't change owner role

    const result = await grantPermission(sessionId, deviceId, userId, newRole);

    if (result.error) {
      console.error('Failed to change participant role:', result.error);
      // You could add a toast notification here
    }
  };

  const getRoleBadgeColor = (role: ParticipantRole) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'editor':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'viewer':
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="space-y-2">
            <div className="h-8 bg-gray-100 rounded"></div>
            <div className="h-8 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden max-w-sm">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <span className="text-sm font-semibold text-gray-900">
            Participants ({participants.length})
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-600 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Participant List */}
      {isExpanded && (
        <div className="max-h-80 overflow-y-auto">
          {participants.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              No participants yet
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Participant info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {participant.nickname || 'Anonymous'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Joined {new Date(participant.joined_at).toLocaleTimeString()}
                      </p>
                    </div>

                    {/* Role badge or dropdown */}
                    {isOwner && participant.role !== 'owner' ? (
                      <select
                        value={participant.role}
                        onChange={(e) =>
                          handleRoleChange(
                            participant.id,
                            participant.device_id,
                            participant.user_id,
                            e.target.value as ParticipantRole
                          )
                        }
                        disabled={isGranting}
                        className={`text-xs px-2 py-1 rounded-md border font-medium cursor-pointer transition-colors ${
                          getRoleBadgeColor(participant.role)
                        } ${
                          isGranting
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:opacity-80'
                        }`}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                      </select>
                    ) : (
                      <span
                        className={`text-xs px-2 py-1 rounded-md border font-medium ${
                          getRoleBadgeColor(participant.role)
                        }`}
                      >
                        {participant.role.charAt(0).toUpperCase() + participant.role.slice(1)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer hint for owners */}
      {isOwner && isExpanded && participants.length > 0 && (
        <div className="px-4 py-2 bg-blue-50 border-t border-blue-100">
          <p className="text-xs text-blue-700">
            <span className="font-medium">Tip:</span> Change participant roles using the dropdown
          </p>
        </div>
      )}
    </div>
  );
}
