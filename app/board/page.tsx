'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCreateSession } from '@/hooks/useCreateSession';
import { useSession } from '@/hooks/useSession';
import { useSaveSession } from '@/hooks/useSaveSession';
import { getDeviceId } from '@/utils/deviceId';
import type { Session } from '@/types/database.types';
import WhiteboardCanvas from '@/components/WhiteboardCanvas';
import SaveSessionButton from '@/components/SaveSessionButton';

export default function BoardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createSession, isCreating } = useCreateSession();

  const sessionCode = searchParams.get('code');
  const { session: existingSession, loading: loadingSession, error: loadError } = useSession(sessionCode);

  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deviceId] = useState(() => getDeviceId());

  // Auto-save session when it loads (for both create and join)
  useSaveSession(session);

  useEffect(() => {
    async function initializeSession() {
      // If we have a code in URL, load that session
      if (sessionCode) {
        if (loadingSession) return;

        if (loadError) {
          setError('Session not found');
          return;
        }

        if (existingSession) {
          setSession(existingSession);
        }
        return;
      }

      // Otherwise, create a new session
      try {
        const newSession = await createSession({ type: 'study-group' });
        setSession(newSession);

        // Update URL with session code (without page reload)
        router.push(`/board?code=${newSession.code}`, { scroll: false });
      } catch (err) {
        console.error('Failed to create session:', err);
        setError('Failed to create whiteboard session');
      }
    }

    initializeSession();
  }, [sessionCode, existingSession, loadingSession, loadError, createSession, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (isCreating || loadingSession || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {loadingSession ? 'Loading whiteboard...' : 'Creating your whiteboard...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen">
      {/* Session info header - repositioned to avoid tldraw toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-white rounded-lg shadow-lg px-4 py-3 border border-gray-200">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs text-gray-500 font-medium">Session Code</p>
            <p className="text-lg font-bold text-gray-900">{session.code}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/board?code=${session.code}`
                );
              }}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
            >
              Copy Link
            </button>
            <SaveSessionButton
              session={session}
              deviceId={deviceId}
              onSaved={() => {
                // Reload session to get updated data
                window.location.reload();
              }}
            />
          </div>
        </div>
      </div>

      {/* Collaborative canvas */}
      <WhiteboardCanvas session={session} />
    </div>
  );
}
