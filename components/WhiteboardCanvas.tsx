'use client';

import { useEffect, useRef, useState } from 'react';
import { Tldraw, Editor, TLRecord } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { useBroadcastChannel } from '@/hooks/useBroadcastChannel';
import type { Session } from '@/types/database.types';

interface WhiteboardCanvasProps {
  session: Session;
}

export default function WhiteboardCanvas({ session }: WhiteboardCanvasProps) {
  const editorRef = useRef<Editor | null>(null);
  const [participantCount, setParticipantCount] = useState(1);

  // Set up broadcast channel for real-time sync
  const { broadcast, isConnected } = useBroadcastChannel({
    sessionCode: session.code,
    onMessage: (message) => {
      if (!editorRef.current) return;

      if (message.type === 'canvas_changes') {
        try {
          const changes = message.payload as { records: TLRecord[] };
          if (changes.records && Array.isArray(changes.records)) {
            editorRef.current.store.put(changes.records);
          }
        } catch (err) {
          console.error('Failed to apply canvas changes:', err);
        }
      }
    },
  });

  // Broadcast canvas changes to other participants
  useEffect(() => {
    if (!editorRef.current || !isConnected) return;

    const editor = editorRef.current;

    // Listen to store changes
    const unsubscribe = editor.store.listen((entry) => {
      const { changes } = entry;
      const addedRecords = Object.values(changes.added);
      const updatedRecords = Object.values(changes.updated).map((change) => change[1]);
      const records = [...addedRecords, ...updatedRecords];

      if (records.length > 0) {
        broadcast({
          type: 'canvas_changes',
          payload: { records },
        });
      }
    });

    return unsubscribe;
  }, [isConnected, broadcast]);

  return (
    <div className="h-full w-full">
      {/* Connection status indicator */}
      <div className="absolute top-4 right-4 z-10">
        <div
          className={`px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 ${
            isConnected ? 'bg-green-50' : 'bg-yellow-50'
          }`}
        >
          <div
            className={`h-2 w-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
            }`}
          />
          <span className="text-sm font-medium">
            {isConnected ? 'Connected' : 'Connecting...'}
          </span>
          <span className="text-xs text-gray-500">
            {participantCount} {participantCount === 1 ? 'user' : 'users'}
          </span>
        </div>
      </div>

      {/* tldraw canvas */}
      <Tldraw
        onMount={(editor) => {
          editorRef.current = editor;
          console.log('Editor mounted');
        }}
        autoFocus
      />
    </div>
  );
}
