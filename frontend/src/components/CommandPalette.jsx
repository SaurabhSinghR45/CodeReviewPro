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
  Copy
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
        setSelectedIndex(prev => (prev + 1) % (filteredActions.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredActions.length) % (filteredActions.length || 1));
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border theme-panel animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-700/50">
          <Search className="w-4 h-4 text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Type a command or search actions..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
          />
          <span className="kbd-shortcut">ESC</span>
        </div>

        {/* Action List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredActions.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 font-mono">
              No matching commands found.
            </div>
          ) : (
            filteredActions.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = selectedIndex === idx;
              return (
                <div
                  key={item.id}
                  onClick={() => { item.action(); onClose(); }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-slate-300 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.title}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    isSelected ? 'bg-indigo-700 text-indigo-100' : 'text-slate-500 bg-slate-900/60'
                  }`}>
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-2 border-t border-slate-800/60 text-[10px] text-slate-500 flex items-center justify-between font-mono">
          <span>Navigate with ↑ ↓ • Press Enter to run</span>
          <span>CodeReviewPro Spotlight</span>
        </div>
      </div>
    </div>
  );
}
