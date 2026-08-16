import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { SignIn, SignUp, useUser } from '@clerk/clerk-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, onContinueGuest, initialMode = 'login' }) {
  let isSignedIn = false;
  let user = null;

  try {
    const userHook = useUser();
    isSignedIn = userHook?.isSignedIn;
    user = userHook?.user;
  } catch (e) {}

  // Auto-dismiss modal ONLY when modal is open and Clerk sign in completes
  useEffect(() => {
    if (isOpen && isSignedIn && user) {
      const formattedUser = {
        id: user.id,
        name: user.fullName || user.firstName || 'Developer',
        email: user.primaryEmailAddress?.emailAddress || 'developer@codereview.pro',
        avatarInitials: (user.fullName || user.firstName || 'SS')
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
        imageUrl: user.imageUrl,
        role: 'Verified Lead Architect',
        workspace: `${(user.firstName || 'Personal')}'s Workspace`,
        githubUser: user.externalAccounts?.find(acc => acc.provider === 'github')?.username || '',
        joinedDate: 'August 2026',
        isVerified: true
      };

      try {
        localStorage.setItem('cr_user', JSON.stringify(formattedUser));
      } catch (e) {}

      if (onAuthSuccess) onAuthSuccess(formattedUser);
      onClose();
    }
  }, [isOpen, isSignedIn, user, onAuthSuccess, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-sans selection:bg-blue-500 selection:text-white">
      <div className="relative max-w-md w-full animate-scaleUp">
        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 p-2 rounded-full bg-[#18181b] border border-white/20 text-white/70 hover:text-white hover:bg-[#27272a] transition-all cursor-pointer z-50 shadow-xl"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Official Clerk Authentication Component with virtual modal routing */}
        <div className="flex justify-center">
          {initialMode === 'signup' ? (
            <SignUp
              routing="virtual"
              fallbackRedirectUrl="/"
            />
          ) : (
            <SignIn
              routing="virtual"
              fallbackRedirectUrl="/"
            />
          )}
        </div>
      </div>
    </div>
  );
}
