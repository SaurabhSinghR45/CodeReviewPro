import React from 'react';
import { 
  Code2, 
  ArrowRight, 
  Play, 
  Layers, 
  ShieldCheck, 
  Bug, 
  Palette, 
  Zap, 
  CheckCircle2, 
  Sparkles,
  GitBranch,
  FolderGit2,
  FileCode2,
  Lock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function LandingPage({ onLaunchApp, onOpenSample, onOpenLogin, onOpenSignup }) {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Navbar */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
            <Code2 className="w-5 h-5" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-[var(--text-primary)]">
            CodeReview<span className="text-blue-600">Pro</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={onOpenLogin || onLaunchApp}
            className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors hidden sm:block cursor-pointer"
          >
            Log In
          </button>
          <button 
            onClick={onOpenSignup || onLaunchApp}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headline & CTA */}
          <div className="lg:col-span-6 space-y-6">
            {/* Version Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-[11px] font-bold tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
              Version 2.4 is Live
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-[var(--text-primary)]">
              Audit Code with <span className="text-blue-600">CodeReviewPro</span>
            </h1>

            <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed max-w-lg">
              CodeReviewPro helps engineering teams collaborate, audit code quality, eliminate security vulnerabilities (OWASP/CWE), and track real-time health metrics in one stunning dashboard.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button 
                onClick={onLaunchApp}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/25 flex items-center gap-2"
              >
                <span>Launch App</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button 
                onClick={onOpenSample}
                className="px-5 py-3 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-semibold transition-all flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current text-blue-600" />
                <span>View Demo PR</span>
              </button>
            </div>
          </div>

          {/* Right Column: Product Preview Mockup */}
          <div className="lg:col-span-6">
            <div className="relative rounded-3xl p-3 bg-gradient-to-tr from-blue-500/10 via-purple-500/5 to-pink-500/10 border border-[var(--border-subtle)] shadow-2xl">
              <div className="rounded-2xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-inner">
                {/* Mockup Topbar */}
                <div className="h-9 px-4 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <span className="ml-2 font-mono text-[10px] text-[var(--text-secondary)]">codereview.pro/workbench</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-blue-500/10 text-blue-600 font-bold">Live AI Audit</span>
                </div>

                {/* Mockup Dashboard Body */}
                <div className="p-4 sm:p-5 space-y-4">
                  {/* Mock Stat Row */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="stat-card-blue p-3 rounded-xl space-y-1">
                      <div className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">Total Audits</div>
                      <div className="text-lg font-extrabold text-[var(--text-primary)]">142</div>
                    </div>
                    <div className="stat-card-green p-3 rounded-xl space-y-1">
                      <div className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">Avg Health</div>
                      <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">94 / 100</div>
                    </div>
                    <div className="stat-card-purple p-3 rounded-xl space-y-1">
                      <div className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">Active Pods</div>
                      <div className="text-lg font-extrabold text-purple-600 dark:text-purple-400">4 Agents</div>
                    </div>
                  </div>

                  {/* Mock Pipeline Card */}
                  <div className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        Multi-Agent Parallel Pipeline
                      </span>
                      <span className="text-[10px] font-mono text-emerald-600 font-semibold">Ready</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-semibold">
                      <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 border border-purple-500/20">Style</div>
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20">Logic Bug</div>
                      <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 border border-rose-500/20">AppSec</div>
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Perf O(n)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section (Syncra 3-Cards Style) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-[var(--border-subtle)]">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
            How CodeReviewPro Works
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Simplify your code review workflow in three easy steps. Designed for speed, security, and algorithmic efficiency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="syncra-card syncra-card-hover p-6 sm:p-7 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center shadow-sm">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              1. Ingest Code & Repos
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Connect any GitHub repository, branch, Pull Request, or paste code directly into the built-in Monaco editor with live language auto-detection.
            </p>
          </div>

          {/* Step 2 */}
          <div className="syncra-card syncra-card-hover p-6 sm:p-7 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center shadow-sm">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              2. 4-Agent Parallel Audit
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Four specialized AI pods analyze your code concurrently for PEP8/Clean Style, Runtime Logic Bugs, OWASP/CWE Vulnerabilities, and Big-O Complexity.
            </p>
          </div>

          {/* Step 3 */}
          <div className="syncra-card syncra-card-hover p-6 sm:p-7 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              3. Staff PR Synthesis
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Receive a synthesized Senior Staff PR review, a 5-axis SVG Health Radar (0-100), and interactive side-by-side Git Diff fix patches.
            </p>
          </div>
        </div>
      </section>

      {/* Get Started in Minutes Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Get Started in Minutes
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">Zero setup required. Review your first file in seconds.</p>
        </div>

        <div className="space-y-3.5">
          <div className="syncra-card p-4 sm:p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-md">
              01
            </div>
            <div>
              <h4 className="text-sm font-bold text-[var(--text-primary)]">Launch the Workbench</h4>
              <p className="text-xs text-[var(--text-secondary)]">Open the interactive developer dashboard in light or dark mode.</p>
            </div>
          </div>

          <div className="syncra-card p-4 sm:p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-md">
              02
            </div>
            <div>
              <h4 className="text-sm font-bold text-[var(--text-primary)]">Submit Repository or Code</h4>
              <p className="text-xs text-[var(--text-secondary)]">Paste any GitHub URL or write code directly into Monaco editor.</p>
            </div>
          </div>

          <div className="syncra-card p-4 sm:p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-md">
              03
            </div>
            <div>
              <h4 className="text-sm font-bold text-[var(--text-primary)]">Execute Parallel Audit</h4>
              <p className="text-xs text-[var(--text-secondary)]">Press Ctrl+Enter to trigger all 4 specialist agent pods simultaneously.</p>
            </div>
          </div>

          <div className="syncra-card p-4 sm:p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-md">
              04
            </div>
            <div>
              <h4 className="text-sm font-bold text-[var(--text-primary)]">Apply Git Diff Fixes</h4>
              <p className="text-xs text-[var(--text-secondary)]">Copy 1-click suggested patches directly to your pull request.</p>
            </div>
          </div>
        </div>

        <div className="text-center pt-10">
          <button
            onClick={onLaunchApp}
            className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all inline-flex items-center gap-2"
          >
            <span>Launch CodeReviewPro Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Minimalist Footer */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] py-8 text-xs text-[var(--text-secondary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              <Code2 className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-[var(--text-primary)]">CodeReviewPro</span>
            <span className="text-[var(--text-muted)]">© 2026 CodeReviewPro. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-5 text-xs text-[var(--text-secondary)]">
            <a href="/docs" target="_blank" rel="noreferrer" className="hover:text-[var(--text-primary)] transition-colors">API Docs</a>
            <button onClick={onLaunchApp} className="hover:text-[var(--text-primary)] transition-colors">Dashboard</button>
            <a href="https://github.com/SaurabhSinghR45/CodeReviewPro" target="_blank" rel="noreferrer" className="hover:text-[var(--text-primary)] transition-colors flex items-center gap-1">
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
