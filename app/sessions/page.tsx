'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import { useSavedSessions } from '@/hooks/useSavedSessions';

export default function SessionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { sessions, loading, reload } = useSavedSessions();
  const [deletingSessionCode, setDeletingSessionCode] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to home if not authenticated
    if (!authLoading && !user) {
      router.push('/');
      return;
    }
  }, [user, authLoading, router]);

  const handleDeleteSession = async (code: string, isOwned: boolean) => {
    if (!confirm('Delete this session permanently? This action cannot be undone.')) {
      return;
    }

    setDeletingSessionCode(code);

    try {
      if (isOwned) {
        // Delete the session itself (only if owned)
        const { error: deleteError } = await supabase
          .from('sessions')
          .delete()
          .eq('code', code);

        if (deleteError) {
          throw deleteError;
        }
      }

      // Remove from session history (works for both owned and joined sessions)
      if (user) {
        const { error: historyError } = await supabase
          .from('session_history')
          .delete()
          .eq('user_id', user.id)
          .eq('session_code', code);

        if (historyError) {
          console.error('Failed to remove from history:', historyError);
        }
      }

      // Reload sessions
      await reload();
    } catch (err) {
      console.error('Failed to delete session:', err);
      alert('Failed to delete session. Please try again.');
    } finally {
      setDeletingSessionCode(null);
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Header />
        <div className="flex min-h-screen items-center justify-center pt-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your sessions...</p>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return null; // Redirecting...
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRelativeTime = (dateString: string | null) => {
    if (!dateString) return 'Never';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Whiteboards</h1>
            <p className="mt-2 text-gray-600">
              All your saved whiteboard sessions in one place
            </p>
          </div>

          {/* Empty state */}
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No saved sessions</h3>
              <p className="text-gray-600 mb-6">
                Start a whiteboard session and click "Save to Account" to see it here.
              </p>
              <Link
                href="/board"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Create Whiteboard
              </Link>
            </div>
          ) : (
            /* Sessions grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map((session) => (
                <div
                  key={session.code}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 overflow-hidden"
                >
                  {/* Session card */}
                  <Link href={`/board?code=${session.code}`} className="block p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {session.sessionName || session.code}
                        </h3>
                        <p className="text-sm text-gray-500">Code: {session.code}</p>
                      </div>
                      {/* Owner badge */}
                      {session.isOwned && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          Owner
                        </span>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Last accessed: {getRelativeTime(session.lastAccessed.toISOString())}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>Created: {formatDate(session.createdAt.toISOString())}</span>
                      </div>
                    </div>
                  </Link>

                  {/* Footer */}
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 capitalize">
                        {session.sessionType.replace('-', ' ')}
                      </span>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/board?code=${session.code}`}
                          className="text-blue-600 font-medium hover:text-blue-700"
                        >
                          Open →
                        </Link>
                        <button
                          onClick={() => handleDeleteSession(session.code, session.isOwned)}
                          disabled={deletingSessionCode === session.code}
                          className="text-red-600 font-medium hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed ml-4"
                        >
                          {deletingSessionCode === session.code ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
