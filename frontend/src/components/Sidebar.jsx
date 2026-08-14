import React from 'react';
import { 
  Code2, 
  BarChart3, 
  History, 
  Sliders, 
  ChevronLeft, 
  X,
  ShieldCheck,
  Zap,
  Palette,
  Bug
} from 'lucide-react';

export default function Sidebar({ 
  activeNav, 
  setActiveNav, 
  isCollapsed, 
  setIsCollapsed, 
  isMobileOpen, 
  setIsMobileOpen, 
  apiHealth, 
  latency 
}) {
  const navItems = [
    { id: 'workbench', label: 'Code Workbench', icon: Code2, badge: 'Live' },
    { id: 'analytics', label: 'Security & Quality', icon: BarChart3 },
    { id: 'history', label: 'Audit History', icon: History },
    { id: 'settings', label: 'Rules & Agents', icon: Sliders },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-fadeIn"
        />
      )}

      {/* Sidebar Rail */}
      <aside 
        className={`fixed top-0 left-0 bottom-0 z-50 theme-panel transition-all duration-300 flex flex-col justify-between ${
          isMobileOpen 
            ? 'translate-x-0 w-64' 
            : '-translate-x-full md:translate-x-0 ' + (isCollapsed ? 'md:w-16' : 'md:w-64')
        }`}
      >
        {/* Top Header */}
        <div>
          <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--border-subtle)]">
            <div className={`flex items-center gap-2.5 min-w-0 ${isCollapsed && !isMobileOpen ? 'mx-auto' : ''}`}>
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
                <Code2 className="w-4 h-4" />
              </div>
              {(!isCollapsed || isMobileOpen) && (
                <div className="min-w-0">
                  <h1 className="text-sm font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-1.5 truncate">
                    CodeReview<span className="text-indigo-500">Pro</span>
                  </h1>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono truncate">Enterprise Edition</p>
                </div>
              )}
            </div>

            {/* Desktop Collapse Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`hidden md:block p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors ${
                isCollapsed ? 'hidden' : 'block'
              }`}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
              title="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Items */}
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
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600/10 text-indigo-500 border border-indigo-500/20'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-transparent'
                  } ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}`}
                  title={isCollapsed && !isMobileOpen ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-500' : 'text-[var(--text-muted)]'}`} />
                  {(!isCollapsed || isMobileOpen) && (
                    <span className="flex-1 text-left truncate">{item.label}</span>
                  )}
                  {(!isCollapsed || isMobileOpen) && item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Telemetry Section */}
        <div className="p-3 border-t border-[var(--border-subtle)] space-y-3">
          {(!isCollapsed || isMobileOpen) && (
            <div className="theme-card p-2.5 rounded-xl text-[11px] space-y-1.5">
              <div className="text-[var(--text-muted)] font-bold uppercase text-[9px] tracking-wider flex items-center justify-between">
                <span>Parallel Agent Core</span>
                <span className="text-emerald-500 font-mono">4 Active</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[10px] text-[var(--text-secondary)] font-mono">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>Style</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Bug</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>AppSec</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Perf</span>
              </div>
            </div>
          )}

          {/* Engine Status Badge */}
          <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl theme-card text-xs ${isCollapsed && !isMobileOpen ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-2 min-w-0">
              {apiHealth === 'online' ? (
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              ) : (
                <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0"></span>
              )}
              {(!isCollapsed || isMobileOpen) && (
                <span className="text-[11px] text-[var(--text-secondary)] font-medium truncate">
                  {apiHealth === 'online' ? 'Core Engine Ready' : 'Engine Offline'}
                </span>
              )}
            </div>
            {(!isCollapsed || isMobileOpen) && latency && (
              <span className="text-[10px] text-[var(--text-muted)] font-mono">{latency}ms</span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
