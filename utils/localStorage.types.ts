// Types for localStorage session persistence

import { SessionType } from '@/types/database.types';

/**
 * Metadata for a saved session in localStorage
 * Stored for anonymous users to track recent sessions
 */
export interface SavedSessionMetadata {
  code: string;
  sessionName: string | null;
  lastAccessed: number; // Unix timestamp (ms)
  createdAt: number; // Unix timestamp (ms)
  createdByThisDevice: boolean;
  sessionType: SessionType;
}

/**
 * Structure of the localStorage store
 * Contains all saved sessions and a version number for future migrations
 */
export interface SavedSessionsStore {
  sessions: SavedSessionMetadata[];
  version: number; // Schema version for future migrations
}
