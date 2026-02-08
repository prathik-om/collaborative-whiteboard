'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useClaimSession } from '@/hooks/useClaimSession';
import AuthModal from './AuthModal';
import type { Session } from '@/types/database.types';

interface SaveSessionButtonProps {
  session: Session;
  deviceId: string;
  onSaved?: () => void;
}

export default function SaveSessionButton({ session, deviceId, onSaved }: SaveSessionButtonProps) {
  const { user } = useAuth();
  const { claimSession, isClaiming } = useClaimSession();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [saved, setSaved] = useState(false);

  // Don't show button if session is already owned
  if (session.user_id) {
    return null;
  }

  // Don't show if session wasn't created by this device
  if (session.created_by_device_id !== deviceId) {
    return null;
  }

  const handleSave = async () => {
    // If not authenticated, show auth modal
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Show name input modal
    setShowNameModal(true);
  };

  const handleConfirmSave = async () => {
    const { success } = await claimSession(
      session.code,
      deviceId,
      sessionName || `Whiteboard ${session.code}`
    );

    if (success) {
      setSaved(true);
      setShowNameModal(false);
      onSaved?.();
    }
  };

  if (saved) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm text-green-800 font-medium">Saved to your account!</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleSave}
        className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 font-medium flex items-center gap-2 transition-colors shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
          />
        </svg>
        Save to Account
      </button>

      {/* Auth Modal (if not logged in) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode="signup"
      />

      {/* Name Input Modal */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Name Your Whiteboard</h3>
            <p className="text-sm text-gray-600 mb-4">
              Give this whiteboard a memorable name so you can find it later.
            </p>
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder={`Whiteboard ${session.code}`}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowNameModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                disabled={isClaiming}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 font-medium"
              >
                {isClaiming ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
