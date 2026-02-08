'use client';

import Link from 'next/link';
import { useSavedSessions } from '@/hooks/useSavedSessions';

/**
 * Format timestamp as relative time (e.g., "2h ago", "3d ago")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

/**
 * RecentSessionsList Component
 * Displays the 5 most recent sessions on the homepage
 */
export default function RecentSessionsList() {
  const { sessions, loading, removeSession } = useSavedSessions();

  // Show top 5 sessions
  const recentSessions = sessions.slice(0, 5);

  // Hide component if no sessions
  if (!loading && recentSessions.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Sessions</h2>
        {sessions.length > 5 && (
          <Link
            href="/sessions"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all →
          </Link>
        )}
      </div>

      <div className="space-y-2">
        {loading ? (
          // Loading skeleton
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-lg p-4 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </>
        ) : (
          // Session cards
          <>
            {recentSessions.map((session) => (
              <div
                key={session.code}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <Link
                    href={`/board?code=${session.code}`}
                    className="flex-1 min-w-0"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {/* Whiteboard icon */}
                      <svg
                        className="w-5 h-5 text-gray-400 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>

                      {/* Session name or code */}
                      <span className="font-medium text-gray-900 truncate group-hover:text-blue-600">
                        {session.sessionName || session.code}
                      </span>

                      {/* Owner badge */}
                      {session.isOwned && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                          Owner
                        </span>
                      )}
                    </div>

                    {/* Relative time */}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{formatRelativeTime(session.lastAccessed)}</span>
                      <span>•</span>
                      <span className="capitalize">{session.sessionType.replace('-', ' ')}</span>
                    </div>
                  </Link>

                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (confirm('Remove this session from your recent list?')) {
                        removeSession(session.code);
                      }
                    }}
                    className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove from recent sessions"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* View all link (mobile) */}
      {!loading && sessions.length > 5 && (
        <Link
          href="/sessions"
          className="block mt-3 text-center text-sm text-blue-600 hover:text-blue-700 font-medium sm:hidden"
        >
          View all sessions →
        </Link>
      )}
    </div>
  );
}
