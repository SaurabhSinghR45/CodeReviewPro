import React, { useState, useEffect, useRef } from 'react';
import { 
  Code2, 
  Search, 
  Plus, 
  Sun, 
  Moon, 
  Laptop, 
  Bell, 
  Settings, 
  ChevronDown, 
  Menu, 
  LayoutTemplate,
  LogIn,
  LogOut,
  User,
  ShieldCheck
} from 'lucide-react';
import { useClerk } from '@clerk/clerk-react';

export default function Header({
  activeTab,
  setActiveTab,
  onNewReview,
  theme,
  setTheme,
  onOpenCommandPalette,
  onToggleSidebar,
  onOpenLanding,
  user,
  onOpenProfile,
  onOpenAuth,
  onLogout
}) {
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  
  let clerk = null;
  try {
    clerk = useClerk();
  } catch (e) {}

  const themeOptions = [
    { id: 'light', label: 'Light Mode', icon: Sun },
    { id: 'dark', label: 'Dark Mode', icon: Moon },
    { id: 'system', label: 'System Default', icon: Laptop },
  ];

  const CurrentThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Laptop;
  const isGuest = !user || user.name === 'Guest Developer' || !user.isVerified;

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOutClick = async () => {
    setShowUserMenu(false);
    try {
      if (clerk && clerk.signOut) {
        await clerk.signOut();
      }
    } catch (e) {}
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <header className="h-16 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 font-sans">
      {/* Left: Mobile Toggle & Brand/Tagline */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
          title="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          {/* Brand Logo */}
          <button 
            onClick={onOpenLanding}
            className="flex items-center gap-2 text-left cursor-pointer group"
            title="CodeReviewPro Home"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <Code2 className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-[var(--text-primary)]">
              CodeReview<span className="text-blue-600">Pro</span>
            </span>
          </button>

          <span className="hidden xl:inline-block text-xs text-[var(--text-muted)] border-l border-[var(--border-subtle)] pl-3">
            Where Code Meets Quality.
          </span>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 max-w-md mx-4 hidden sm:block">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] hover:border-blue-500/40 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-all shadow-inner group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-blue-500 group-hover:text-blue-600 transition-colors" />
            <span>Search actions, commands, samples...</span>
          </div>
          <kbd className="kbd-shortcut font-mono">⌘K</kbd>
        </button>
      </div>

      {/* Right Actions & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* New Review Quick Action */}
        <button
          onClick={onNewReview}
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-600/20 cursor-pointer"
          title="Start a fresh code audit"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Review</span>
        </button>

        {/* Product Tour Button */}
        <button
          onClick={onOpenLanding}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] hover:bg-[var(--bg-elevated)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shadow-sm cursor-pointer"
          title="View Landing Page & Tour"
        >
          <LayoutTemplate className="w-3.5 h-3.5 text-blue-600" />
          <span>Tour</span>
        </button>

        {/* Theme Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="flex items-center gap-1.5 p-2 px-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-main)] hover:bg-[var(--bg-elevated)] text-xs font-semibold text-[var(--text-primary)] transition-colors shadow-sm cursor-pointer"
            title="Theme Mode"
          >
            <CurrentThemeIcon className="w-4 h-4 text-blue-600" />
            <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
          </button>

          {showThemeMenu && (
            <div className="absolute right-0 mt-1.5 w-36 rounded-2xl theme-panel shadow-xl p-1.5 space-y-0.5 z-50 animate-fadeIn font-sans text-xs border border-[var(--border-subtle)]">
              {themeOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = theme === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => { setTheme(opt.id); setShowThemeMenu(false); }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-500/10 text-blue-600 font-bold' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* User Profile / Login Action (Clerk Style Dropdown) */}
        {isGuest ? (
          <button
            onClick={() => onOpenAuth('login')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        ) : (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 pl-2 border-l border-[var(--border-subtle)] cursor-pointer group"
              title="Open User Profile"
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-blue-500/20 group-hover:scale-105 transition-transform">
                  {user?.avatarInitials || 'SS'}
                </div>
                {user?.isVerified && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[var(--bg-surface)] flex items-center justify-center text-white text-[8px]">
                    ✓
                  </span>
                )}
              </div>
            </button>

            {/* Clerk Style User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-[#18181b] text-white border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-scaleUp font-sans">
                {/* User Header */}
                <div className="p-4 flex items-center gap-3 border-b border-white/10">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md">
                    {user?.avatarInitials || 'SS'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate">
                      {user?.name || 'SAURABH SINGH'}
                    </div>
                    <div className="text-[11px] text-white/60 truncate font-mono">
                      {user?.email || 'samratsaurabh2003@gmail.com'}
                    </div>
                  </div>
                </div>

                {/* Dropdown Options */}
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenProfile();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-white/60" />
                    <span>Manage account</span>
                  </button>

                  <button
                    onClick={handleSignOutClick}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Sign out</span>
                  </button>
                </div>

                {/* Bottom Clerk Badge */}
                <div className="px-4 py-2.5 bg-black/40 border-t border-white/5 flex flex-col items-center justify-center text-[10px] text-white/40">
                  <div className="flex items-center gap-1.5 font-medium text-white/60">
                    <span>Secured by</span>
                    <strong className="text-white font-bold">clerk</strong>
                  </div>
                  <span className="text-amber-500/80 font-mono text-[9px]">Development mode</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
