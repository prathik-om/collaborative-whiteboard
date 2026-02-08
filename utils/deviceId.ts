/**
 * Get or generate a unique device ID for this browser
 * Stored in localStorage for persistence across sessions
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') {
    return ''; // Server-side, return empty
  }

  const STORAGE_KEY = 'whiteboard_device_id';

  // Try to get existing device ID
  let deviceId = localStorage.getItem(STORAGE_KEY);

  // If none exists, generate a new one
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(STORAGE_KEY, deviceId);
  }

  return deviceId;
}
