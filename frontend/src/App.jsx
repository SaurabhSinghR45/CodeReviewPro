import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ReviewForm from './components/ReviewForm';
import ResultsView from './components/ResultsView';
import HistoryView from './components/HistoryView';
import AnalyticsView from './components/AnalyticsView';
import SettingsView from './components/SettingsView';
import CommandPalette from './components/CommandPalette';

export default function App() {
  const [activeNav, setActiveNav] = useState('workbench');
  const [currentView, setCurrentView] = useState('form');
  const [reviewData, setReviewData] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [apiHealth, setApiHealth] = useState('checking');
  const [latency, setLatency] = useState(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Theme Management (dark, light, system)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('cr_theme') || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    localStorage.setItem('cr_theme', theme);

    if (theme === 'system') {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.remove('dark', 'light');
      root.classList.add(isSystemDark ? 'dark' : 'light');
    } else {
      root.classList.remove('dark', 'light');
      root.classList.add(theme);
    }
  }, [theme]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Health check polling
  useEffect(() => {
    const checkHealth = async () => {
      const start = performance.now();
      try {
        const res = await fetch('/health');
        const end = performance.now();
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'ok') {
            setApiHealth('online');
            setLatency(Math.round(end - start));
            return;
          }
        }
        setApiHealth('offline');
      } catch (err) {
        setApiHealth('offline');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 25000);
    return () => clearInterval(interval);
  }, []);

  const handleReviewComplete = (data) => {
    setReviewData(data);
    setActiveNav('workbench');
    setCurrentView('results');
  };

  const handleSelectFromHistory = (data) => {
    setReviewData(data);
    setActiveNav('workbench');
    setCurrentView('results');
  };

  const handleNewReview = () => {
    setActiveNav('workbench');
    setCurrentView('form');
  };

  const handleNavChange = (navId) => {
    setActiveNav(navId);
  };

  const handleSelectSampleFromPalette = (sampleType) => {
    setActiveNav('workbench');
    setCurrentView('form');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] flex font-sans selection:bg-indigo-500 selection:text-white transition-colors">
      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(navId) => { setActiveNav(navId); if (navId === 'workbench') setCurrentView('form'); }}
        onSelectSample={handleSelectSampleFromPalette}
        onSetTheme={setTheme}
        currentTheme={theme}
      />

      {/* Left Navigation Rail */}
      <Sidebar
        activeNav={activeNav}
        setActiveNav={handleNavChange}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        apiHealth={apiHealth}
        latency={latency}
      />

      {/* Main Workspace Area with Responsive Margin */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ml-0 ${isCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
        {/* Top Navbar */}
        <Header
          activeTab={activeNav}
          setActiveTab={handleNavChange}
          onNewReview={handleNewReview}
          theme={theme}
          setTheme={setTheme}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onToggleSidebar={() => setIsMobileOpen(prev => !prev)}
        />

        {/* Dynamic Workspace Views */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6">
          {activeNav === 'workbench' && currentView === 'form' && (
            <ReviewForm onReviewComplete={handleReviewComplete} />
          )}

          {activeNav === 'workbench' && currentView === 'results' && (
            <ResultsView
              reviewData={reviewData}
              onBackToForm={handleNewReview}
            />
          )}

          {activeNav === 'analytics' && (
            <AnalyticsView />
          )}

          {activeNav === 'history' && (
            <HistoryView onSelectReview={handleSelectFromHistory} />
          )}

          {activeNav === 'settings' && (
            <SettingsView />
          )}
        </main>

        {/* Developer Footer */}
        <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] py-4 text-xs text-[var(--text-muted)]">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--text-secondary)] font-mono text-[11px]">CodeReviewPro Enterprise</span>
              <span>•</span>
              <span>Autonomous Multi-Agent Code Intelligence Platform</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[10px] text-[var(--text-muted)]">
              <span>OWASP Top 10</span>
              <span>•</span>
              <span>CWE Database</span>
              <span>•</span>
              <span>O(n) Big-O Analyzer</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
