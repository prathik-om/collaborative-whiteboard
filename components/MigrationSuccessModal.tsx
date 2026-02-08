'use client';

import { useRouter } from 'next/navigation';
import type { MigrationResult } from '@/hooks/useMigrateLocalSessions';

interface MigrationSuccessModalProps {
  result: MigrationResult | null;
  onClose: () => void;
}

/**
 * MigrationSuccessModal Component
 * Shows migration results after user signs up
 */
export default function MigrationSuccessModal({ result, onClose }: MigrationSuccessModalProps) {
  const router = useRouter();

  // Don't render if no result
  if (!result || result.migrated === 0) {
    return null;
  }

  const handleViewSessions = () => {
    onClose();
    router.push('/sessions');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        {/* Success icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Sessions Migrated Successfully!
        </h2>

        {/* Description */}
        <p className="text-center text-gray-600 mb-6">
          Your previous sessions are now saved to your account and will sync across all your
          devices.
        </p>

        {/* Stats */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Sessions migrated</span>
            <span className="text-xl font-bold text-green-600">{result.migrated}</span>
          </div>

          {result.claimed > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Sessions claimed as owner</span>
              <span className="text-xl font-bold text-blue-600">{result.claimed}</span>
            </div>
          )}

          {result.failed > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Failed to migrate</span>
              <span className="text-xl font-bold text-red-600">{result.failed}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Close
          </button>
          <button
            onClick={handleViewSessions}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            View Sessions
          </button>
        </div>
      </div>
    </div>
  );
}
