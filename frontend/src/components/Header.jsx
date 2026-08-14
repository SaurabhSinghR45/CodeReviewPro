import React, { useState } from 'react';
import { 
  Code2, 
  Search, 
  Sun, 
  Moon, 
  Laptop, 
  ExternalLink, 
  ChevronDown,
  Menu
} from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  onNewReview, 
  theme, 
  setTheme, 
  onOpenCommandPalette,
  onToggleSidebar
}) {
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const themeOptions = [
    { id: 'dark', label: 'Dark Obsidian', icon: Moon },
    { id: 'light', label: 'Light Studio', icon: Sun },
    { id: 'system', label: 'System Default', icon: Laptop },
  ];

  const CurrentThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Laptop;

  return (
    <header className="h-14 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6">
      {/* Left: Mobile menu toggle & Breadcrumbs */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-1.5 rounded-lg theme-card text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
          <span className="font-bold text-[var(--text-primary)]">codereview</span>
          <span>/</span>
          <span className="text-indigo-500 font-semibold capitalize">{activeTab}</span>
        </div>
      </div>

      {/* Center: Command Palette Trigger */}
      <div className="flex-1 max-w-md mx-4 hidden sm:block">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl theme-card text-xs text-[var(--text-secondary)] transition-colors group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-indigo-500 transition-colors" />
            <span>Search actions, commands, samples...</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="kbd-shortcut">Ctrl</span>
            <span className="kbd-shortcut">K</span>
          </div>
        </button>
      </div>

      {/* Right: Actions & Theme Switcher */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Search Button */}
        <button
          onClick={onOpenCommandPalette}
          className="sm:hidden p-1.5 rounded-lg theme-card text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          title="Command Palette"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Theme Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="flex items-center gap-1.5 p-1.5 px-2.5 rounded-xl theme-card text-xs font-semibold text-[var(--text-primary)] transition-colors"
            title="Theme Mode"
          >
            <CurrentThemeIcon className="w-3.5 h-3.5 text-indigo-500" />
            <span className="capitalize hidden md:inline text-[11px]">{theme}</span>
            <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
          </button>

          {showThemeMenu && (
            <div className="absolute right-0 mt-1.5 w-36 rounded-xl theme-panel shadow-xl p-1 space-y-0.5 z-50 animate-fadeIn font-sans text-xs">
              {themeOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = theme === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => { setTheme(opt.id); setShowThemeMenu(false); }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                      isSelected ? 'bg-indigo-600/10 text-indigo-500 font-bold' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
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

        {/* API Docs Link */}
        <a
          href="/docs"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl theme-card text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono transition-colors"
        >
          <span>API Docs</span>
          <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />
        </a>
      </div>
    </header>
  );
}
