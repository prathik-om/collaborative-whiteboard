'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session, ParticipantRole } from '@/types/database.types';

interface SessionSettingsProps {
  session: Session;
  isOwner: boolean;
  onUpdate?: () => void;
}

export default function SessionSettings({ session, isOwner, onUpdate }: SessionSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPublic, setIsPublic] = useState(session.is_public);
  const [defaultRole, setDefaultRole] = useState<ParticipantRole>(
    session.default_participant_role
  );
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Check if settings have changed
  useEffect(() => {
    const changed =
      isPublic !== session.is_public || defaultRole !== session.default_participant_role;
    setHasChanges(changed);
  }, [isPublic, defaultRole, session]);

  const handleSave = async () => {
    if (!isOwner || !hasChanges) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          is_public: isPublic,
          default_participant_role: defaultRole,
        })
        .eq('id', session.id);

      if (error) throw error;

      // Call onUpdate callback to refresh session data
      if (onUpdate) {
        onUpdate();
      }

      console.log('Session settings updated successfully');
    } catch (err) {
      console.error('Failed to update session settings:', err);
      // Reset to original values on error
      setIsPublic(session.is_public);
      setDefaultRole(session.default_participant_role);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setIsPublic(session.is_public);
    setDefaultRole(session.default_participant_role);
  };

  if (!isOwner) return null;

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
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="text-sm font-semibold text-gray-900">Session Settings</span>
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

      {/* Settings Panel */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Board Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Board Visibility
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={isPublic}
                  onChange={() => setIsPublic(true)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Public</span>
                  <p className="text-xs text-gray-500">Anyone with the link can join</p>
                </div>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={!isPublic}
                  onChange={() => setIsPublic(false)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Private</span>
                  <p className="text-xs text-gray-500">Only signed-in users can join</p>
                </div>
              </label>
            </div>
          </div>

          {/* Default Participant Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New participants join as
            </label>
            <select
              value={defaultRole}
              onChange={(e) => setDefaultRole(e.target.value as ParticipantRole)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="viewer">Viewer (read-only)</option>
              <option value="editor">Editor (can draw)</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              You can change individual permissions in the Participants list
            </p>
          </div>

          {/* Save/Reset Buttons */}
          {hasChanges && (
            <div className="flex gap-2 pt-2 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md transition-colors ${
                  isSaving
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                }`}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleReset}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Reset
              </button>
            </div>
          )}

          {/* Info message when no changes */}
          {!hasChanges && (
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Make changes above and click Save to update settings
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
