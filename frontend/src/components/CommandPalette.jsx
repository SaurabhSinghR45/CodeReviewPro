import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Code2, 
  BarChart3, 
  History, 
  Sliders, 
  Sun, 
  Moon, 
  Laptop, 
  FolderGit2, 
  FileCode, 
  Sparkles, 
  ArrowRight,
  Zap,
  ShieldCheck,
  Download,
  Copy,
  X
} from 'lucide-react';

export default function CommandPalette({ 
  isOpen, 
  onClose, 
  onNavigate, 
  onSelectSample, 
  onSetTheme, 
  currentTheme 
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const actions = [
    // Navigation
    { id: 'nav-wb', category: 'Navigation', title: 'Open Code Workbench', icon: Code2, action: () => onNavigate('workbench') },
    { id: 'nav-an', category: 'Navigation', title: 'View Security & Quality Analytics', icon: BarChart3, action: () => onNavigate('analytics') },
    { id: 'nav-hi', category: 'Navigation', title: 'Open Audit History Database', icon: History, action: () => onNavigate('history') },
    { id: 'nav-st', category: 'Navigation', title: 'Configure Agent Rules & Settings', icon: Sliders, action: () => onNavigate('settings') },

    // Samples
    { id: 'sample-vibe', category: 'Sample Repositories', title: 'Load VibeSync Full Repository (GitHub)', icon: FolderGit2, action: () => onSelectSample('vibesync') },
    { id: 'sample-code', category: 'Sample Code', title: 'Load Payment Service Vulnerable Code Snippet', icon: FileCode, action: () => onSelectSample('code') },
    { id: 'sample-pr', category: 'Sample Repositories', title: 'Load Octocat Pull Request #1347', icon: FolderGit2, action: () => onSelectSample('pr') },

    // Themes
    { id: 'theme-dark', category: 'Appearance', title: 'Switch to Dark Obsidian Mode', icon: Moon, action: () => onSetTheme('dark') },
    { id: 'theme-light', category: 'Appearance', title: 'Switch to Light Studio Mode', icon: Sun, action: () => onSetTheme('light') },
    { id: 'theme-sys', category: 'Appearance', title: 'Sync with System Default Theme', icon: Laptop, action: () => onSetTheme('system') },
  ];

  const filteredActions = actions.filter(a => 
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < filteredActions.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredActions.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredActions[selectedIndex]) {
          filteredActions[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredActions, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border theme-panel animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input with Clickable Cross (X) */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <Search className="w-4 h-4 text-blue-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Type a command or search actions..."
            className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none font-sans"
          />
          {/* Replaced ESC with Clickable Cross (X) */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
            title="Close Search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1 bg-[var(--bg-surface)]">
          {filteredActions.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--text-muted)] font-mono">
              No matching commands found.
            </div>
          ) : (
            filteredActions.map((action, idx) => {
              const Icon = action.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={action.id}
                  onClick={() => {
                    action.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all text-left cursor-pointer ${
                    isSelected 
                      ? 'bg-blue-600 text-white font-semibold shadow-md' 
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-blue-500'}`} />
                    <span className="truncate">{action.title}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md shrink-0 ml-2 ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
                  }`}>
                    {action.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-[var(--bg-elevated)] border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono">
          <div className="flex items-center gap-2">
            <span>Navigate with ↑ ↓</span>
            <span>•</span>
            <span>Press Enter to run</span>
          </div>
          <span>CodeReviewPro Spotlight</span>
        </div>
      </div>
    </div>
  );
}
