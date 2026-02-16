'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Tldraw, Editor, TLRecord } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { useBroadcastChannel } from '@/hooks/useBroadcastChannel';
import { useParticipantPermission } from '@/hooks/useParticipantPermission';
import { supabase } from '@/lib/supabase';
import type { Session } from '@/types/database.types';

interface WhiteboardCanvasProps {
  session: Session;
}

export default function WhiteboardCanvas({ session }: WhiteboardCanvasProps) {
  const editorRef = useRef<Editor | null>(null);
  const [participantCount, setParticipantCount] = useState(1);
  const activityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityUpdateRef = useRef<number>(Date.now());
  const saveSnapshotTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSnapshotSaveRef = useRef<number>(0);

  // Check participant permissions
  const { canEdit, role, loading: permissionLoading } = useParticipantPermission(session);

  // Debounced function to update last_activity_at (prevent excessive DB writes)
  const updateActivity = useCallback(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastActivityUpdateRef.current;

    // Only update if 30 seconds have passed since last update
    if (timeSinceLastUpdate < 30000) {
      // Schedule an update for later if not already scheduled
      if (!activityTimerRef.current) {
        activityTimerRef.current = setTimeout(() => {
          activityTimerRef.current = null;
          updateActivity();
        }, 30000 - timeSinceLastUpdate);
      }
      return;
    }

    // Update the database
    lastActivityUpdateRef.current = now;
    supabase
      .from('sessions')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('code', session.code)
      .then(({ error }) => {
        if (error) {
          console.error('Failed to update session activity:', error);
        }
      });
  }, [session.code]);

  // Save canvas snapshot to database (debounced every 5 seconds)
  const saveSnapshot = useCallback(() => {
    if (!editorRef.current) return;

    const now = Date.now();
    const timeSinceLastSave = now - lastSnapshotSaveRef.current;

    // Only save if 5 seconds have passed since last save
    if (timeSinceLastSave < 5000) {
      // Schedule a save for later if not already scheduled
      if (!saveSnapshotTimerRef.current) {
        saveSnapshotTimerRef.current = setTimeout(() => {
          saveSnapshotTimerRef.current = null;
          saveSnapshot();
        }, 5000 - timeSinceLastSave);
      }
      return;
    }

    // Get current canvas snapshot
    const snapshot = editorRef.current.store.getStoreSnapshot();
    lastSnapshotSaveRef.current = now;

    // Save to database
    supabase
      .from('sessions')
      .update({ canvas_snapshot: snapshot })
      .eq('code', session.code)
      .then(({ error }) => {
        if (error) {
          console.error('Failed to save canvas snapshot:', error);
        } else {
          console.log('Canvas snapshot saved to database');
        }
      });
  }, [session.code]);

  // Set up broadcast channel for real-time sync
  const { broadcast, isConnected } = useBroadcastChannel({
    sessionCode: session.code,
    onMessage: (message) => {
      if (!editorRef.current) return;

      if (message.type === 'canvas_changes') {
        try {
          const changes = message.payload as { records: TLRecord[] };
          if (changes.records && Array.isArray(changes.records)) {
            // CRITICAL: Use mergeRemoteChanges() to prevent infinite loops
            // This tells tldraw these changes came from remote (don't re-broadcast)
            editorRef.current.store.mergeRemoteChanges(() => {
              editorRef.current!.store.put(changes.records);
            });
          }
        } catch (err) {
          console.error('Failed to apply canvas changes:', err);
        }
      }
    },
  });

  // Note: Canvas snapshot is now loaded in the onMount callback
  // This ensures the editor is ready before we try to load data

  // Enforce read-only mode based on permissions
  useEffect(() => {
    if (!editorRef.current || permissionLoading) return;

    // Set editor to read-only if user cannot edit
    editorRef.current.updateInstanceState({ isReadonly: !canEdit });

    console.log(`Canvas mode: ${canEdit ? 'editable' : 'read-only'} (role: ${role})`);
  }, [canEdit, permissionLoading, role]);

  // Broadcast canvas changes to other participants & track activity
  useEffect(() => {
    if (!editorRef.current || !isConnected || !canEdit) return;

    const editor = editorRef.current;

    // Listen to store changes
    const unsubscribe = editor.store.listen((entry) => {
      // CRITICAL: Only broadcast changes from the local user, not remote changes
      // This prevents infinite loops where remote changes get broadcast back
      if (entry.source !== 'user') return;

      // CRITICAL: Guard against viewers broadcasting (defense-in-depth)
      if (!canEdit) return;

      const { changes } = entry;
      const addedRecords = Object.values(changes.added);
      const updatedRecords = Object.values(changes.updated).map((change) => change[1]);
      const records = [...addedRecords, ...updatedRecords];

      if (records.length > 0) {
        broadcast({
          type: 'canvas_changes',
          payload: { records },
        });

        // Track activity for cleanup system
        updateActivity();

        // Save canvas snapshot to database (debounced)
        saveSnapshot();
      }
    });

    return () => {
      unsubscribe();
      // Clear any pending timers
      if (activityTimerRef.current) {
        clearTimeout(activityTimerRef.current);
      }
      if (saveSnapshotTimerRef.current) {
        clearTimeout(saveSnapshotTimerRef.current);
      }
    };
  }, [isConnected, broadcast, updateActivity, saveSnapshot, canEdit]);

  return (
    <div className="h-full w-full">
      {/* Connection status indicator - moved to bottom-right to avoid tldraw UI overlap */}
      <div className="absolute bottom-20 right-4 z-50">
        <div
          className={`px-3 py-2 rounded-lg shadow-lg flex flex-col gap-1 border ${
            isConnected
              ? 'bg-green-50 border-green-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
              }`}
            />
            <span className="text-sm font-medium text-gray-900">
              {isConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <span className="text-xs text-gray-600">
              {participantCount} {participantCount === 1 ? 'user' : 'users'}
            </span>
            {role && (
              <>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-700 font-medium">
                  {role === 'owner' ? 'Owner' : role === 'editor' ? 'Can edit' : 'View only'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* tldraw canvas */}
      <Tldraw
        onMount={(editor) => {
          editorRef.current = editor;
          console.log('Editor mounted');

          // Load canvas snapshot if it exists
          if (session.canvas_snapshot && typeof session.canvas_snapshot === 'object') {
            try {
              // Cast to any to satisfy TypeScript - tldraw will validate the snapshot structure
              editor.store.loadSnapshot(session.canvas_snapshot as any);
              console.log('Canvas snapshot loaded successfully');
            } catch (err) {
              console.error('Failed to load canvas snapshot:', err);
            }
          }
        }}
        autoFocus
      />
    </div>
  );
}
