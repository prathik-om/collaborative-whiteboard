import { useAuth } from '@/lib/auth-context';

/**
 * Convenience hook to get the current authenticated user
 * Returns null if user is not authenticated
 */
export function useUser() {
  const { user, loading } = useAuth();
  return { user, loading };
}
