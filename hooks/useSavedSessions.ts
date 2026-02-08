'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from './useUser';
import { SessionStorageManager } from '@/utils/sessionStorage';
import type { Session, SessionHistory } from '@/types/database.types';

/**
 * Unified saved session interface
 * Represents a session from either localStorage or database
 */
export interface SavedSession {
  code: string;
  sessionName: string | null;
  lastAccessed: Date;
  createdAt: Date;
  sessionType: string;
  isOwned: boolean; // True if user created this session
  source: 'local' | 'database';
}

/**
 * Hook to load saved sessions
 * - Anonymous users: Load from localStorage
 * - Authenticated users: Load from database (owned sessions + history)
 */
export function useSavedSessions() {
  const { user, loading: userLoading } = useUser();
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (user) {
        // Authenticated: Load from database
        await loadFromDatabase();
      } else {
        // Anonymous: Load from localStorage
        loadFromLocalStorage();
      }
    } catch (err) {
      console.error('Failed to load saved sessions:', err);
      setError(err instanceof Error ? err : new Error('Failed to load sessions'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Load sessions from database for authenticated users
   * Merges owned sessions + session history, deduplicates
   */
  const loadFromDatabase = async () => {
    if (!user) return;

    // Load owned sessions
    const { data: ownedSessions, error: ownedError } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (ownedError) {
      throw ownedError;
    }

    // Load session history
    const { data: history, error: historyError } = await supabase
      .from('session_history')
      .select('*')
      .eq('user_id', user.id)
      .order('last_accessed_at', { ascending: false });

    if (historyError) {
      throw historyError;
    }

    // Convert to SavedSession format and merge
    const savedSessions = new Map<string, SavedSession>();

    // Add owned sessions first (priority)
    ownedSessions?.forEach((session: Session) => {
      savedSessions.set(session.code, {
        code: session.code,
        sessionName: session.session_name,
        lastAccessed: new Date(session.last_activity_at || session.created_at),
        createdAt: new Date(session.created_at),
        sessionType: session.session_type,
        isOwned: true,
        source: 'database',
      });
    });

    // Add history sessions (skip if already owned)
    history?.forEach((historyItem: SessionHistory) => {
      if (!savedSessions.has(historyItem.session_code)) {
        savedSessions.set(historyItem.session_code, {
          code: historyItem.session_code,
          sessionName: historyItem.session_name,
          lastAccessed: new Date(historyItem.last_accessed_at),
          createdAt: new Date(historyItem.first_accessed_at),
          sessionType: historyItem.session_type || 'study-group',
          isOwned: false,
          source: 'database',
        });
      }
    });

    // Convert to array and sort by lastAccessed
    const sorted = Array.from(savedSessions.values()).sort(
      (a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime()
    );

    setSessions(sorted);
  };

  /**
   * Load sessions from localStorage for anonymous users
   */
  const loadFromLocalStorage = () => {
    const localSessions = SessionStorageManager.loadSessions();

    const saved: SavedSession[] = localSessions.map((session) => ({
      code: session.code,
      sessionName: session.sessionName,
      lastAccessed: new Date(session.lastAccessed),
      createdAt: new Date(session.createdAt),
      sessionType: session.sessionType,
      isOwned: session.createdByThisDevice,
      source: 'local' as const,
    }));

    setSessions(saved);
  };

  /**
   * Remove a session from the list
   * - localStorage: Remove from local storage
   * - Database: Remove from session_history (does NOT delete the session itself)
   */
  const removeSession = useCallback(
    async (code: string) => {
      try {
        if (user) {
          // Remove from session_history (not from sessions table)
          const { error } = await supabase
            .from('session_history')
            .delete()
            .eq('user_id', user.id)
            .eq('session_code', code);

          if (error) {
            throw error;
          }
        } else {
          // Remove from localStorage
          SessionStorageManager.removeSession(code);
        }

        // Update local state
        setSessions((prev) => prev.filter((s) => s.code !== code));
      } catch (err) {
        console.error('Failed to remove session:', err);
        throw err;
      }
    },
    [user]
  );

  // Load sessions when user state changes
  useEffect(() => {
    if (!userLoading) {
      loadSessions();
    }
  }, [user, userLoading, loadSessions]);

  return {
    sessions,
    loading: loading || userLoading,
    error,
    reload: loadSessions,
    removeSession,
  };
}
