import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ReviewForm from './components/ReviewForm';
import ResultsView from './components/ResultsView';
import HistoryView from './components/HistoryView';
import AnalyticsView from './components/AnalyticsView';
import SettingsView from './components/SettingsView';
import CommandPalette from './components/CommandPalette';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';

export default function App() {
  // Always start on Landing Page when visiting the site
  const [showLanding, setShowLanding] = useState(true);
  const [activeNav, setActiveNav] = useState('workbench');
  const [currentView, setCurrentView] = useState('form');
  const [reviewData, setReviewData] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [apiHealth, setApiHealth] = useState('online');
  const [latency, setLatency] = useState(18);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [prefillGithubUrl, setPrefillGithubUrl] = useState('');

  // User Profile State: Defaults to Guest Developer for fresh visitors
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('cr_user');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      name: 'Guest Developer',
      email: 'guest@codereview.pro',
      avatarInitials: 'GD',
      role: 'Guest Developer',
      workspace: 'Guest Workspace',
      githubUser: '',
      joinedDate: 'August 2026',
      isVerified: false
    };
  });

  // Modal States
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Theme Management (Light by default for clean Syncra aesthetic)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('cr_theme') || 'light';
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
    setShowLanding(false);
    setActiveNav('workbench');
    setCurrentView('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectFromHistory = (data) => {
    setReviewData(data);
    setShowLanding(false);
    setActiveNav('workbench');
    setCurrentView('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewReview = (updatedCode) => {
    if (typeof updatedCode === 'string' && updatedCode.trim()) {
      try {
        sessionStorage.setItem('cr_raw_code', updatedCode);
        sessionStorage.setItem('cr_input_mode', 'code');
      } catch (e) {}
    }
    setReviewData(null);
    setShowLanding(false);
    setActiveNav('workbench');
    setCurrentView('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavChange = (navId) => {
    setShowLanding(false);
    setActiveNav(navId);
    if (navId === 'workbench') {
      setCurrentView('form');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectSampleFromPalette = (sampleType) => {
    setShowLanding(false);
    setActiveNav('workbench');
    setCurrentView('form');
  };

  const handleSelectProject = (projectUrl) => {
    try {
      sessionStorage.setItem('cr_input_mode', 'url');
      sessionStorage.setItem('cr_github_url', projectUrl);
    } catch (e) {}
    setPrefillGithubUrl(projectUrl);
    setShowLanding(false);
    setActiveNav('workbench');
    setCurrentView('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setIsAuthOpen(false);
    setShowLanding(false); // Seamless redirect into dashboard!
    setActiveNav('workbench');
    setCurrentView('form');
  };

  const handleContinueGuest = () => {
    const guestUser = {
      name: 'Guest Developer',
      email: 'guest@codereview.pro',
      avatarInitials: 'GD',
      role: 'Guest Developer',
      workspace: 'Guest Workspace',
      githubUser: '',
      joinedDate: 'August 2026',
      isVerified: false
    };
    setUser(guestUser);
    setShowLanding(false); // Move to workbench with zero login required!
    setActiveNav('workbench');
    setCurrentView('form');
  };

  const handleLogout = () => {
    const guestUser = {
      name: 'Guest Developer',
      email: 'guest@codereview.pro',
      avatarInitials: 'GD',
      role: 'Guest Developer',
      workspace: 'Guest Workspace',
      githubUser: '',
      joinedDate: 'August 2026',
      isVerified: false
    };
    setUser(guestUser);
    try {
      localStorage.removeItem('cr_user');
    } catch (e) {}
    setIsProfileOpen(false);
    // Remain on the same dashboard page as Guest Developer with 0 history
    setShowLanding(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] flex font-sans selection:bg-blue-500 selection:text-white transition-colors">
      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={handleNavChange}
        onSelectSample={handleSelectSampleFromPalette}
        onSetTheme={setTheme}
        currentTheme={theme}
      />

      {/* Authentication Modal with All Sign-in Options */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        onContinueGuest={handleContinueGuest}
        initialMode={authMode}
      />

      {/* User Profile & Workspace Settings Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onUpdateUser={(updated) => setUser(updated)}
        onLogout={handleLogout}
      />

      {/* Render Full Landing View or App Dashboard */}
      {showLanding ? (
        <div className="w-full">
          <LandingPage 
            onLaunchApp={handleContinueGuest}
            onOpenSample={handleContinueGuest}
            onOpenLogin={() => {
              setAuthMode('login');
              setIsAuthOpen(true);
            }}
            onOpenSignup={() => {
              setAuthMode('signup');
              setIsAuthOpen(true);
            }}
          />
        </div>
      ) : (
        <>
          {/* Left Syncra-Style Navigation Rail */}
          <Sidebar
            activeNav={activeNav}
            setActiveNav={handleNavChange}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            isMobileOpen={isMobileOpen}
            setIsMobileOpen={setIsMobileOpen}
            apiHealth={apiHealth}
            latency={latency}
            user={user}
            onOpenProfile={() => {
              if (user.isVerified) {
                setIsProfileOpen(true);
              } else {
                setAuthMode('login');
                setIsAuthOpen(true);
              }
            }}
            onSelectProject={handleSelectProject}
          />

          {/* Main Dashboard Area */}
          <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ml-0 ${isCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
            {/* Top Header */}
            <Header
              activeTab={activeNav}
              setActiveTab={handleNavChange}
              onNewReview={handleNewReview}
              theme={theme}
              setTheme={setTheme}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              onToggleSidebar={() => setIsMobileOpen(prev => !prev)}
              onOpenLanding={() => setShowLanding(true)}
              user={user}
              onOpenProfile={() => {
                if (user.isVerified) {
                  setIsProfileOpen(true);
                } else {
                  setAuthMode('login');
                  setIsAuthOpen(true);
                }
              }}
              onOpenAuth={(mode) => { setAuthMode(mode); setIsAuthOpen(true); }}
              onLogout={handleLogout}
            />

            {/* Dynamic Workspace Views */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              {activeNav === 'workbench' && currentView === 'form' && (
                <ReviewForm 
                  onReviewComplete={handleReviewComplete} 
                  user={user}
                  onOpenAuth={(mode) => { setAuthMode(mode); setIsAuthOpen(true); }}
                />
              )}

              {activeNav === 'workbench' && currentView === 'results' && (
                <ResultsView
                  reviewData={reviewData}
                  onBackToForm={handleNewReview}
                />
              )}

              {activeNav === 'analytics' && (
                <AnalyticsView user={user} />
              )}

              {activeNav === 'history' && (
                <HistoryView 
                  user={user}
                  onSelectReview={handleSelectFromHistory} 
                  onOpenAuth={(mode) => { setAuthMode(mode); setIsAuthOpen(true); }}
                />
              )}

              {activeNav === 'settings' && (
                <SettingsView />
              )}
            </main>

            {/* Minimalist Syncra-style Footer */}
            <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] py-4 text-xs text-[var(--text-muted)]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[var(--text-secondary)]">CodeReviewPro</span>
                  <span>•</span>
                  <span>Autonomous Multi-Agent Code & AppSec Review Platform</span>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-[var(--text-muted)]">
                  <button onClick={() => setShowLanding(true)} className="hover:text-[var(--text-primary)] transition-colors cursor-pointer">Product Tour</button>
                  <a href="/docs" target="_blank" rel="noreferrer" className="hover:text-[var(--text-primary)] transition-colors">API Docs</a>
                  <span>OWASP Top 10</span>
                  <span>CWE Matrix</span>
                </div>
              </div>
            </footer>
          </div>
        </>
      )}
    </div>
  );
}
