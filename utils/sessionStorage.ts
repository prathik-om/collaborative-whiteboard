// Session Storage Manager
// Manages localStorage persistence for anonymous users

import type { SavedSessionMetadata, SavedSessionsStore } from './localStorage.types';

const STORAGE_KEY = 'whiteboard_saved_sessions';
const MAX_SESSIONS = 10;
const QUOTA_EXCEEDED_FALLBACK = 5; // Reduce to 5 sessions if quota exceeded
const CURRENT_VERSION = 1;

/**
 * SessionStorageManager
 * Handles localStorage operations for session persistence
 * Used by anonymous users to track recent sessions
 */
export class SessionStorageManager {
  /**
   * Check if localStorage is available
   * Returns false in SSR or if localStorage is disabled
   */
  private static isAvailable(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      const testKey = '__localStorage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Load all saved sessions from localStorage
   * Returns empty array if localStorage unavailable or corrupted
   */
  static loadSessions(): SavedSessionMetadata[] {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return [];
      }

      const store: SavedSessionsStore = JSON.parse(stored);

      // Validate schema version
      if (store.version !== CURRENT_VERSION) {
        // Future: Handle migrations here
        console.warn('Session storage version mismatch, clearing store');
        this.clearAll();
        return [];
      }

      // Sort by most recent first
      const sorted = store.sessions.sort((a, b) => b.lastAccessed - a.lastAccessed);

      return sorted;
    } catch (error) {
      console.error('Failed to load sessions from localStorage:', error);
      return [];
    }
  }

  /**
   * Save or update a session in localStorage
   * Auto-evicts oldest sessions if MAX_SESSIONS exceeded
   * Handles quota exceeded errors gracefully
   */
  static saveSession(metadata: SavedSessionMetadata): void {
    if (!this.isAvailable()) {
      return;
    }

    try {
      const sessions = this.loadSessions();

      // Check if session already exists (update it)
      const existingIndex = sessions.findIndex((s) => s.code === metadata.code);

      if (existingIndex !== -1) {
        // Update existing session
        sessions[existingIndex] = {
          ...sessions[existingIndex],
          ...metadata,
          lastAccessed: Date.now(), // Always update lastAccessed
        };
      } else {
        // Add new session
        sessions.unshift(metadata);
      }

      // Enforce max sessions limit (evict oldest)
      const trimmed = sessions.slice(0, MAX_SESSIONS);

      // Save to localStorage
      this.writeStore(trimmed);
    } catch (error) {
      // Handle quota exceeded
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, reducing to 5 sessions');
        this.handleQuotaExceeded(metadata);
      } else {
        console.error('Failed to save session to localStorage:', error);
      }
    }
  }

  /**
   * Remove a session by code
   */
  static removeSession(code: string): void {
    if (!this.isAvailable()) {
      return;
    }

    try {
      const sessions = this.loadSessions();
      const filtered = sessions.filter((s) => s.code !== code);
      this.writeStore(filtered);
    } catch (error) {
      console.error('Failed to remove session from localStorage:', error);
    }
  }

  /**
   * Clear all saved sessions
   */
  static clearAll(): void {
    if (!this.isAvailable()) {
      return;
    }

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear sessions from localStorage:', error);
    }
  }

  /**
   * Handle quota exceeded by reducing to 5 most recent sessions
   * Then try to save the new session again
   */
  private static handleQuotaExceeded(newSession: SavedSessionMetadata): void {
    try {
      const sessions = this.loadSessions();

      // Keep only the 4 most recent sessions + the new one = 5 total
      const reduced = sessions.slice(0, QUOTA_EXCEEDED_FALLBACK - 1);
      reduced.unshift(newSession);

      this.writeStore(reduced);
    } catch (error) {
      console.error('Failed to handle quota exceeded:', error);
      // Last resort: clear everything
      this.clearAll();
    }
  }

  /**
   * Write sessions to localStorage
   * Internal helper method
   */
  private static writeStore(sessions: SavedSessionMetadata[]): void {
    const store: SavedSessionsStore = {
      sessions,
      version: CURRENT_VERSION,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  /**
   * Get total number of saved sessions
   */
  static getCount(): number {
    return this.loadSessions().length;
  }

  /**
   * Check if a session is already saved
   */
  static hasSession(code: string): boolean {
    const sessions = this.loadSessions();
    return sessions.some((s) => s.code === code);
  }
}
