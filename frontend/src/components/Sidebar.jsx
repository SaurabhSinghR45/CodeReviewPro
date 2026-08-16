import React from 'react';
import { 
  LayoutGrid, 
  BarChart3, 
  History, 
  Sliders, 
  ChevronLeft, 
  ChevronDown, 
  X, 
  FolderGit2, 
  Users, 
  Settings, 
  Plus, 
  CircleDot, 
  CheckCircle2, 
  Cpu 
} from 'lucide-react';

export default function Sidebar({ 
  activeNav, 
  setActiveNav, 
  isCollapsed, 
  setIsCollapsed, 
  isMobileOpen, 
  setIsMobileOpen, 
  apiHealth, 
  latency,
  user,
  onOpenProfile,
  onSelectProject
}) {
  const isGuest = !user || user.name === 'Guest Developer' || !user.isVerified;

  const navItems = [
    { id: 'workbench', label: 'Dashboard', icon: LayoutGrid },
    { id: 'analytics', label: 'Security & Quality', icon: BarChart3 },
    { id: 'history', label: 'Audit History', icon: History, count: isGuest ? '0' : '12' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const projects = [
    { id: 'vibesync', name: 'VibeSync', color: 'bg-blue-500', url: 'https://github.com/SaurabhSinghR45/VibeSync' },
    { id: 'codereview', name: 'CodeReviewPro', color: 'bg-purple-500', url: 'https://github.com/SaurabhSinghR45/CodeReviewPro' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden animate-fadeIn"
        />
      )}

      {/* Sidebar Rail */}
      <aside 
        className={`fixed top-0 left-0 bottom-0 z-50 theme-panel border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] transition-all duration-300 flex flex-col justify-between ${
          isMobileOpen 
            ? 'translate-x-0 w-64' 
            : '-translate-x-full md:translate-x-0 ' + (isCollapsed ? 'md:w-16' : 'md:w-64')
        }`}
      >
        <div>
          {/* Workspace User Pill Header (Syncra Style) */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--border-subtle)]">
            {(!isCollapsed || isMobileOpen) ? (
              <button
                onClick={onOpenProfile}
                className="flex items-center justify-between w-full min-w-0 pr-1 hover:opacity-80 transition-opacity text-left cursor-pointer group"
                title="Manage Workspace & Profile"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-blue-500/20 shrink-0 group-hover:scale-105 transition-transform">
                    {user?.avatarInitials || 'SS'}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider truncate">
                      {user?.name || 'SAURABH SINGH'}
                    </h2>
                    <p className="text-[10px] text-[var(--text-muted)] truncate">{user?.workspace || 'Personal Workspace'}</p>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 group-hover:text-[var(--text-primary)] transition-colors" />
              </button>
            ) : (
              <button 
                onClick={onOpenProfile}
                className="w-8 h-8 mx-auto rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-blue-500/20 cursor-pointer"
                title={user?.name || 'Profile'}
              >
                {user?.avatarInitials || 'SS'}
              </button>
            )}

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveNav(item.id);
                    setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                  } ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}`}
                  title={isCollapsed && !isMobileOpen ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--text-muted)]'}`} />
                  {(!isCollapsed || isMobileOpen) && (
                    <span className="flex-1 text-left truncate">{item.label}</span>
                  )}
                  {(!isCollapsed || isMobileOpen) && item.count && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Projects Section (Syncra Style) */}
          {(!isCollapsed || isMobileOpen) && (
            <div className="px-4 pt-4 border-t border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                <span>Projects</span>
                <span className="text-[10px] text-blue-600 font-mono font-semibold">2 Active</span>
              </div>

              <div className="space-y-1">
                {projects.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => {
                      if (onSelectProject) onSelectProject(proj.url);
                      setActiveNav('workbench');
                      setIsMobileOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer group text-left"
                  >
                    <span className={`w-2 h-2 rounded-full ${proj.color} group-hover:scale-125 transition-transform`}></span>
                    <span className="truncate flex-1">{proj.name}</span>
                    <span className="text-[10px] text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity">Load ▸</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section: Status Indicator & Collapse button */}
        <div className="p-3 border-t border-[var(--border-subtle)] space-y-2">
          {/* Status Indicator */}
          <div className={`flex items-center gap-2 px-2.5 py-2 rounded-xl bg-[var(--bg-elevated)] text-xs ${isCollapsed && !isMobileOpen ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              {(!isCollapsed || isMobileOpen) && (
                <span className="text-[11px] text-[var(--text-secondary)] font-semibold truncate">
                  Core Engine Ready
                </span>
              )}
            </div>
            {(!isCollapsed || isMobileOpen) && latency && (
              <span className="text-[10px] text-[var(--text-muted)] font-mono">{latency}ms</span>
            )}
          </div>

          {/* Desktop Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex w-full items-center justify-center py-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors text-xs cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>
    </>
  );
}
