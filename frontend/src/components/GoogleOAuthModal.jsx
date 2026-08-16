import React, { useState } from 'react';
import { User, Plus, X, Loader2, Code2 } from 'lucide-react';

const GoogleGLogo = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
  </svg>
);

export default function GoogleOAuthModal({ isOpen, onClose, onSelectAccount }) {
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [customEmail, setCustomEmail] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const accounts = [
    {
      name: 'SAURABH SINGH',
      email: 'samratsaurabh2003@gmail.com',
      avatar: 'SS',
      color: 'bg-emerald-500'
    },
    {
      name: 'SAURABH SINGH',
      email: 'ss24mcf1r45@student.nitw.ac.in',
      avatar: 'NITW',
      color: 'bg-blue-600'
    }
  ];

  const handleChoose = (acc) => {
    setSelectedEmail(acc.email);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSelectAccount({
        name: acc.name,
        email: acc.email,
        avatarInitials: acc.avatar.slice(0, 2),
        role: 'Verified Lead Architect',
        isVerified: true,
        workspace: `${acc.name.split(' ')[0]}'s Workspace`,
        githubUser: 'SaurabhSinghR45',
        joinedDate: 'August 2026',
        tier: 'Pro Enterprise'
      });
      onClose();
    }, 600);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) return;
    const nameFromEmail = customEmail.split('@')[0].replace(/[._]/g, ' ');
    const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
    handleChoose({
      name: formattedName,
      email: customEmail,
      avatar: formattedName.slice(0, 2).toUpperCase(),
      color: 'bg-indigo-600'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-sans">
      {/* Real Google Account Chooser Window */}
      <div className="relative w-full max-w-[680px] bg-[#131314] text-[#e3e3e3] border border-[#2d2e30] rounded-3xl shadow-2xl overflow-hidden animate-scaleUp">
        {/* Top Google Bar */}
        <div className="px-6 py-4 border-b border-[#2d2e30] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <GoogleGLogo className="w-5 h-5" />
            <span className="text-sm font-medium text-[#e3e3e3]">Sign in with Google</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main 2-Column Content */}
        <div className="p-8 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Left Column: Google & App Branding */}
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
              <Code2 className="w-5 h-5" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-normal text-white tracking-tight leading-tight">
              Choose an account
            </h1>

            <p className="text-sm text-[#9aa0a6]">
              to continue to <strong className="text-white font-medium">CodeReviewPro</strong>
            </p>
          </div>

          {/* Right Column: Account Selection List */}
          <div className="space-y-3">
            {loading ? (
              <div className="py-12 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
                <p className="text-sm text-[#9aa0a6]">Signing in with Google...</p>
              </div>
            ) : showCustomInput ? (
              <form onSubmit={handleCustomSubmit} className="space-y-3 animate-fadeIn">
                <label className="block text-xs text-[#9aa0a6]">Enter your Google email</label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full px-4 py-3 bg-[#1e1f20] border border-[#3c4043] rounded-xl text-sm text-white placeholder-[#5f6368] focus:outline-none focus:border-[#8ab4f8]"
                />
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(false)}
                    className="px-4 py-2 text-xs text-[#8ab4f8] hover:bg-white/5 rounded-lg"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#8ab4f8] text-[#041e49] text-xs font-bold hover:bg-[#a8c7fa] transition-colors"
                  >
                    Next
                  </button>
                </div>
              </form>
            ) : (
              <div className="divide-y divide-[#2d2e30] border-y border-[#2d2e30]">
                {accounts.map((acc, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleChoose(acc)}
                    className="w-full flex items-center gap-3.5 py-3.5 px-2 hover:bg-white/[0.04] transition-colors text-left cursor-pointer rounded-lg group"
                  >
                    <div className={`w-8 h-8 rounded-full ${acc.color} text-white flex items-center justify-center text-xs font-bold shadow-sm shrink-0`}>
                      {acc.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-white truncate">{acc.name}</div>
                      <div className="text-[11px] text-[#9aa0a6] truncate">{acc.email}</div>
                    </div>
                  </button>
                ))}

                {/* Use Another Account Option */}
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="w-full flex items-center gap-3.5 py-3.5 px-2 hover:bg-white/[0.04] transition-colors text-left cursor-pointer rounded-lg group"
                >
                  <div className="w-8 h-8 rounded-full border border-[#3c4043] text-[#9aa0a6] flex items-center justify-center text-xs shrink-0 group-hover:border-white/50">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-[#e3e3e3]">Use another account</span>
                </button>
              </div>
            )}

            <p className="text-[11px] text-[#9aa0a6] leading-relaxed pt-2">
              Before using this app, you can review CodeReviewPro’s{' '}
              <span className="text-[#8ab4f8] hover:underline cursor-pointer">Privacy Policy</span> and{' '}
              <span className="text-[#8ab4f8] hover:underline cursor-pointer">Terms of Service</span>.
            </p>
          </div>
        </div>

        {/* Bottom Google Footer Bar */}
        <div className="px-8 py-3 bg-[#1e1f20]/50 border-t border-[#2d2e30] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#9aa0a6] gap-2">
          <span className="hover:text-white cursor-pointer">English (United States)</span>
          <div className="flex items-center gap-6">
            <span className="hover:text-white cursor-pointer">Help</span>
            <span className="hover:text-white cursor-pointer">Privacy</span>
            <span className="hover:text-white cursor-pointer">Terms</span>
          </div>
        </div>
      </div>
    </div>
  );
}
