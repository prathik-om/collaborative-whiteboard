'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCreateSession } from '@/hooks/useCreateSession';
import type { Session } from '@/types/database.types';
import WhiteboardCanvas from '@/components/WhiteboardCanvas';

export default function BoardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createSession, isCreating } = useCreateSession();

  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sessionCode = searchParams.get('code');

  useEffect(() => {
    async function initializeSession() {
      // If we have a code in URL, load that session
      if (sessionCode) {
        // TODO: Load session from database by code
        console.log('Loading session:', sessionCode);
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
  }, [sessionCode, createSession, router]);

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

  if (isCreating || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Creating your whiteboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen">
      {/* Session info header */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg px-4 py-2">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs text-gray-500">Session Code</p>
            <p className="text-lg font-bold">{session.code}</p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/board?code=${session.code}`
              );
            }}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Copy Link
          </button>
        </div>
      </div>

      {/* Collaborative canvas */}
      <WhiteboardCanvas session={session} />
    </div>
  );
}
