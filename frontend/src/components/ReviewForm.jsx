import React, { useState, useEffect, useRef } from 'react';
import { 
  FileCode, 
  Play, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  Code, 
  Upload, 
  Sliders, 
  ShieldCheck, 
  Bug, 
  Palette, 
  Zap, 
  Trash2,
  GitBranch,
  Star,
  GitFork,
  FolderTree,
  CheckSquare,
  Square,
  Terminal as TerminalIcon,
  Search,
  Plus,
  FolderGit2,
  CheckCircle2,
  Users,
  ShieldAlert,
  Award,
  Brain,
  ChevronDown,
  ImagePlus,
  X
} from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import AgentTopology from './AgentTopology';

const GithubIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const SAMPLE_REPOS = [
  { label: 'VibeSync Full Repo', url: 'https://github.com/SaurabhSinghR45/VibeSync' },
  { label: 'FastAPI Applications File', url: 'https://github.com/fastapi/fastapi/blob/master/fastapi/applications.py' },
  { label: 'Octocat PR #1347', url: 'https://github.com/octocat/Hello-World/pull/1347' },
];

const SAMPLE_CODE_SNIPPET = `def process_user_payment(user_id, amount, card_token=None):
    # AppSec Vulnerability (CWE-89): Direct String Formatted SQL Injection
    query = f"SELECT role, balance, secret_key FROM users WHERE id = '{user_id}'"
    user = db.execute(query).fetchone()

    # Logic Bug: Unhandled None check if user is not found
    if user['balance'] < amount:
        raise ValueError("Insufficient funds")

    # Performance Issue: Nested O(n^2) loop over user transaction history
    all_transactions = db.query("SELECT * FROM transactions").fetchall()
    user_txs = []
    for tx in all_transactions:
        for u_tx in user['history']:
            if tx['id'] == u_tx['id']:
                user_txs.append(tx)

    # Style Issue: Missing type hints & magic values
    if card_token == "TEST_TOKEN_2026":
        amount = amount - 5
    
    # Bug Risk: Negative balance mutation
    user['balance'] = user['balance'] - amount
    return {"status": "success", "remaining_balance": user['balance']}
`;

const LANGUAGES = [
  'auto',
  'python',
  'javascript',
  'typescript',
  'cpp',
  'go',
  'rust',
  'java',
  'sql',
  'html/css'
];

export default function ReviewForm({ onReviewComplete, user, onOpenAuth }) {
  let clerkAuth = null;
  try {
    clerkAuth = useAuth();
  } catch (e) {}

  const [inputMode, setInputMode] = useState(() => {
    return sessionStorage.getItem('cr_input_mode') || 'code';
  });
  const [githubUrl, setGithubUrl] = useState(() => {
    return sessionStorage.getItem('cr_github_url') || '';
  });
  const [rawCode, setRawCode] = useState(() => {
    return sessionStorage.getItem('cr_raw_code') || '';
  });
  const [language, setLanguage] = useState(() => {
    return sessionStorage.getItem('cr_language') || 'auto';
  });
  const [problemDescription, setProblemDescription] = useState(() => {
    return sessionStorage.getItem('cr_problem_description') || sessionStorage.getItem('cr_problem_context') || '';
  });
  const [problemImage, setProblemImage] = useState(() => {
    return sessionStorage.getItem('cr_problem_image') || '';
  });
  const [showDsaPanel, setShowDsaPanel] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');

  // Persist form state across tab switches and results navigation
  useEffect(() => {
    try { sessionStorage.setItem('cr_input_mode', inputMode); } catch (e) {}
  }, [inputMode]);

  useEffect(() => {
    try { sessionStorage.setItem('cr_github_url', githubUrl); } catch (e) {}
  }, [githubUrl]);

  useEffect(() => {
    try { sessionStorage.setItem('cr_raw_code', rawCode); } catch (e) {}
  }, [rawCode]);

  useEffect(() => {
    try { sessionStorage.setItem('cr_language', language); } catch (e) {}
  }, [language]);

  useEffect(() => {
    try { sessionStorage.setItem('cr_problem_description', problemDescription); } catch (e) {}
  }, [problemDescription]);

  useEffect(() => {
    try { sessionStorage.setItem('cr_problem_image', problemImage); } catch (e) {}
  }, [problemImage]);

  const isGuest = !user || user.name === 'Guest Developer' || !user.isVerified;
  const [stats, setStats] = useState({ totalAudits: 0, avgHealth: 0, grade: 'N/A' });

  const hasFetchedStats = useRef(false);

  useEffect(() => {
    if (isGuest) {
      setStats({ totalAudits: 0, avgHealth: 0, grade: 'N/A' });
      hasFetchedStats.current = false;
      return;
    }

    if (hasFetchedStats.current) return;
    hasFetchedStats.current = true;

    const loadUserStats = async () => {
      try {
        const userEmail = user?.email || '';
        const res = await fetch(`/reviews?user_email=${encodeURIComponent(userEmail)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const avg = Math.round(data.reduce((acc, r) => acc + (r.health_score || 0), 0) / data.length);
            let grade = 'A';
            if (avg < 60) grade = 'F';
            else if (avg < 70) grade = 'D';
            else if (avg < 80) grade = 'C';
            else if (avg < 90) grade = 'B';
            setStats({ totalAudits: data.length, avgHealth: avg, grade: `Grade ${grade}` });
            return;
          } else {
            setStats({ totalAudits: 0, avgHealth: 0, grade: 'N/A' });
            return;
          }
        }
      } catch (e) {}
      setStats({ totalAudits: 0, avgHealth: 0, grade: 'N/A' });
    };

    loadUserStats();
  }, [user?.email, isGuest]);

  // Repo Inspector State
  const [isInspecting, setIsInspecting] = useState(false);
  const [repoMeta, setRepoMeta] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileFilter, setFileFilter] = useState('');

  // Agent Config State
  const [showConfig, setShowConfig] = useState(false);
  const [agentsConfig, setAgentsConfig] = useState({
    style: true,
    bugs: true,
    security: true,
    performance: true,
  });
  const [strictness, setStrictness] = useState('standard');

  // Execution & Terminal Logs
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  const MAX_CHARS = 20000;

  // Keyboard shortcut: Ctrl+Enter to submit
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleSubmit(e);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Live Repo Inspector Trigger
  useEffect(() => {
    if (inputMode !== 'url' || !githubUrl.trim() || !githubUrl.includes('github.com')) {
      setRepoMeta(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsInspecting(true);
      try {
        const res = await fetch('/github/inspect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: githubUrl.trim() }),
        });
        if (res.ok) {
          const data = await res.json();
          setRepoMeta(data);
          if (data.files && data.files.length > 0) {
            setSelectedFiles(data.files.slice(0, 5).map(f => f.path));
          }
        }
      } catch (err) {
        // Silent fail
      } finally {
        setIsInspecting(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [githubUrl, inputMode]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('File size exceeds 2MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      setRawCode(text);
      setUploadedFileName(file.name);
      setInputMode('code');
      setErrorMsg('');

      const ext = file.name.split('.').pop()?.toLowerCase();
      if (['py'].includes(ext)) setLanguage('python');
      else if (['js', 'jsx'].includes(ext)) setLanguage('javascript');
      else if (['ts', 'tsx'].includes(ext)) setLanguage('typescript');
      else if (['go'].includes(ext)) setLanguage('go');
      else if (['rs'].includes(ext)) setLanguage('rust');
      else if (['java'].includes(ext)) setLanguage('java');
      else if (['cpp', 'c', 'h'].includes(ext)) setLanguage('cpp');
      else if (['sql'].includes(ext)) setLanguage('sql');
      else setLanguage('auto');
    };
    reader.readAsText(file);
  };

  const handleFormatCode = () => {
    if (!rawCode.trim()) return;
    try {
      const lines = rawCode.split('\n');
      let indentLevel = 0;
      const formatted = lines.map((rawLine) => {
        let line = rawLine.trim();
        if (!line) return '';

        if (line.startsWith('}') || line.startsWith(')')) {
          indentLevel = Math.max(0, indentLevel - 1);
        }

        const indentStr = '    '.repeat(indentLevel);
        const result = indentStr + line;

        if (line.endsWith('{') || line.endsWith('(') || (line.endsWith(':') && !line.startsWith('//'))) {
          indentLevel++;
        }

        return result;
      }).join('\n');

      setRawCode(formatted);
      try {
        sessionStorage.setItem('cr_raw_code', formatted);
      } catch (e) {}
    } catch (e) {}
  };

  const toggleFileSelection = (path) => {
    setSelectedFiles(prev => 
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  const selectAllFiles = () => {
    if (repoMeta?.files) {
      setSelectedFiles(repoMeta.files.map(f => f.path));
    }
  };

  const deselectAllFiles = () => {
    setSelectedFiles([]);
  };

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString();
    setTerminalLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isLoading) return;

    setErrorMsg('');
    setTerminalLogs([]);

    if (inputMode === 'url') {
      if (!githubUrl.trim()) {
        setErrorMsg('Please enter a GitHub repository, file, or PR link.');
        return;
      }
      if (!githubUrl.includes('github.com')) {
        setErrorMsg('URL must be a valid github.com link.');
        return;
      }
    } else {
      if (!rawCode.trim()) {
        setErrorMsg('Please paste or upload code to review.');
        return;
      }
      if (rawCode.length > MAX_CHARS) {
        setErrorMsg(`Code length (${rawCode.length} chars) exceeds maximum allowed limit of ${MAX_CHARS} characters.`);
        return;
      }
    }

    setIsLoading(true);
    setLoadingStep(1);
    addLog('Initializing multi-agent review pipeline...');

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev === 1) addLog('Parallel Agents analyzing: Style, Bug, AppSec, Performance...');
        if (prev === 2) addLog('Auditing OWASP Top 10, CWE security matrix, and Big-O complexity...');
        if (prev === 3) addLog('Synthesizing Staff PR review & computing Health Score...');
        return prev < 4 ? prev + 1 : prev;
      });
    }, 1200);

    try {
      const payload = {
        language: language === 'auto' ? 'auto' : language,
        agents_config: agentsConfig,
        strictness: strictness,
        user_email: user?.email || 'guest@codereview.pro',
        problem_context: problemDescription.trim() || undefined,
        problem_image: problemImage || undefined
      };

      if (inputMode === 'url') {
        payload.github_url = githubUrl.trim();
        if (selectedFiles.length > 0) {
          payload.selected_files = selectedFiles;
        }
      } else {
        payload.raw_code = rawCode.trim();
      }

      const headers = { 'Content-Type': 'application/json' };
      try {
        if (clerkAuth && clerkAuth.getToken) {
          const clerkToken = await clerkAuth.getToken();
          if (clerkToken) {
            headers['Authorization'] = `Bearer ${clerkToken}`;
          }
        }
        if (!headers['Authorization']) {
          const stored = localStorage.getItem('cr_user');
          if (stored) {
            const u = JSON.parse(stored);
            if (u.id || u.email) {
              headers['Authorization'] = `Bearer ${btoa(u.id || u.email)}`;
            }
          }
        }
      } catch (e) {}

      const res = await fetch('/review', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      clearInterval(stepInterval);

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to process review.');
      }

      addLog(`Audit #${data.id} finished with Health Score: ${data.health_score?.score || 100}/100.`);
      setLoadingStep(4);
      
      setTimeout(() => {
        setIsLoading(false);
        onReviewComplete(data);
      }, 400);

    } catch (err) {
      clearInterval(stepInterval);
      setIsLoading(false);
      setErrorMsg(err.message || 'An unexpected error occurred.');
      addLog(`ERROR: ${err.message}`);
    }
  };

  const loadSample = (type = 'code') => {
    if (type === 'vibesync') {
      setInputMode('url');
      setGithubUrl('https://github.com/SaurabhSinghR45/VibeSync');
      setErrorMsg('');
    } else if (type === 'pr') {
      setInputMode('url');
      setGithubUrl('https://github.com/octocat/Hello-World/pull/1347');
      setErrorMsg('');
    } else {
      setInputMode('code');
      setRawCode(SAMPLE_CODE_SNIPPET);
      setLanguage('python');
      setUploadedFileName('payment_service.py');
      setErrorMsg('');
    }
  };

  const filteredRepoFiles = (repoMeta?.files || []).filter(f => 
    f.path.toLowerCase().includes(fileFilter.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-7">
      {/* Guest Mode Notification Bar if not authenticated */}
      {isGuest && (
        <div className="p-3.5 px-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-blue-600 dark:text-blue-400 animate-fadeIn">
          <div className="flex items-center gap-2.5 text-left">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>
              <strong>Guest Session Active:</strong> You can test any code or repository instantly. Create a verified free account to sync audit history and export PDF reports.
            </span>
          </div>
          <button
            onClick={() => onOpenAuth && onOpenAuth('signup')}
            className="px-3 py-1 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shrink-0 shadow-sm cursor-pointer"
          >
            Create Account
          </button>
        </div>
      )}

      {/* Top Welcome & Action Header (Syncra Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Welcome back, <span className="text-blue-600">{user?.name || 'SAURABH SINGH'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Here's what's happening with your code reviews and repository audits today in <span className="font-semibold text-[var(--text-primary)]">{user?.workspace || 'Workspace'}</span>.
          </p>
        </div>

        <button
          onClick={() => { setInputMode('code'); loadSample('code'); }}
          className="syncra-btn-primary px-5 py-2.5 flex items-center gap-2 text-xs shadow-md shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Review</span>
        </button>
      </div>

      {/* 4 Pastel Gradient Metric Cards (Syncra Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Audits (Blue) */}
        <div className="stat-card-blue p-5 rounded-2xl syncra-card-hover flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[var(--text-secondary)] block">Total Audits</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] block">
              {isGuest ? 0 : stats.totalAudits}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] block truncate">
              {isGuest ? 'No audits recorded' : `projects in ${user?.workspace || 'Workspace'}`}
            </span>
          </div>
          <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 text-blue-600 flex items-center justify-center shadow-sm shrink-0">
            <FolderGit2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Average Health (Green) */}
        <div className="stat-card-green p-5 rounded-2xl syncra-card-hover flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[var(--text-secondary)] block">Average Health</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 block">
              {isGuest ? '0 / 100' : `${stats.avgHealth} / 100`}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] block">
              {isGuest ? 'No audit data yet' : `${stats.grade} quality rating`}
            </span>
          </div>
          <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 text-emerald-600 flex items-center justify-center shadow-sm shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Active AI Pods (Purple) */}
        <div className="stat-card-purple p-5 rounded-2xl syncra-card-hover flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[var(--text-secondary)] block">Parallel Pods</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400 block">4 Agents</span>
            <span className="text-[10px] text-[var(--text-muted)] block">Style, Bug, AppSec, Perf</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 text-purple-600 flex items-center justify-center shadow-sm shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Security Matrix (Amber) */}
        <div className="stat-card-amber p-5 rounded-2xl syncra-card-hover flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[var(--text-secondary)] block">Security Rules</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 block">OWASP 10</span>
            <span className="text-[10px] text-[var(--text-muted)] block">CWE-89, CWE-798, CWE-22</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 text-amber-600 flex items-center justify-center shadow-sm shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Multi-Agent Pipeline Topology Card */}
      <AgentTopology isAuditing={isLoading} />

      {/* Main Review Workbench Box */}
      <div className="syncra-card p-5 sm:p-7 space-y-6">
        {/* Workbench Segmented Control Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center p-1 bg-[var(--bg-elevated)] rounded-xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => { setInputMode('url'); setErrorMsg(''); }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                inputMode === 'url'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <GithubIcon className="w-4 h-4" />
              GitHub Repo / PR
            </button>

            <button
              type="button"
              onClick={() => { setInputMode('code'); setErrorMsg(''); }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                inputMode === 'code'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <FileCode className="w-4 h-4" />
              Monaco Editor
            </button>

            <button
              type="button"
              onClick={() => { setInputMode('file'); setErrorMsg(''); }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                inputMode === 'file'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Upload className="w-4 h-4" />
              File Upload
            </button>
          </div>

          {/* Toolbar Controls */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <span className="text-[11px] font-mono font-medium">Lang:</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 capitalize"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang === 'auto' ? 'Auto-Detect' : lang.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className={`p-1.5 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                showConfig
                  ? 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                  : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Ruleset
            </button>

            <button
              type="button"
              onClick={() => loadSample('code')}
              className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline underline-offset-4 flex items-center gap-1"
            >
              <Code className="w-3.5 h-3.5" />
              Sample
            </button>
          </div>
        </div>

        {/* Rules & Sensitivity Config Drawer */}
        {showConfig && (
          <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-bold text-[var(--text-primary)]">
              <span className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                Active Multi-Agent Rule Matrix
              </span>
              <span className="text-[var(--text-muted)] font-mono text-[11px]">Strictness: Standard</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <label className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer text-xs font-semibold ${
                agentsConfig.style ? 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400' : 'theme-card text-[var(--text-muted)]'
              }`}>
                <input
                  type="checkbox"
                  checked={agentsConfig.style}
                  onChange={(e) => setAgentsConfig({...agentsConfig, style: e.target.checked})}
                  className="rounded text-purple-600 focus:ring-0"
                />
                <Palette className="w-3.5 h-3.5" />
                Style (Clean Code)
              </label>

              <label className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer text-xs font-semibold ${
                agentsConfig.bugs ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400' : 'theme-card text-[var(--text-muted)]'
              }`}>
                <input
                  type="checkbox"
                  checked={agentsConfig.bugs}
                  onChange={(e) => setAgentsConfig({...agentsConfig, bugs: e.target.checked})}
                  className="rounded text-amber-600 focus:ring-0"
                />
                <Bug className="w-3.5 h-3.5" />
                Logic & Bugs
              </label>

              <label className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer text-xs font-semibold ${
                agentsConfig.security ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400' : 'theme-card text-[var(--text-muted)]'
              }`}>
                <input
                  type="checkbox"
                  checked={agentsConfig.security}
                  onChange={(e) => setAgentsConfig({...agentsConfig, security: e.target.checked})}
                  className="rounded text-rose-600 focus:ring-0"
                />
                <ShieldCheck className="w-3.5 h-3.5" />
                AppSec (OWASP)
              </label>

              <label className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer text-xs font-semibold ${
                agentsConfig.performance ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'theme-card text-[var(--text-muted)]'
              }`}>
                <input
                  type="checkbox"
                  checked={agentsConfig.performance}
                  onChange={(e) => setAgentsConfig({...agentsConfig, performance: e.target.checked})}
                  className="rounded text-emerald-600 focus:ring-0"
                />
                <Zap className="w-3.5 h-3.5" />
                O(n) Performance
              </label>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-3 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Review Notice</strong>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Form Workspace */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {inputMode === 'url' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  GitHub Repository, Pull Request, or File URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
                    <GithubIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="e.g. https://github.com/SaurabhSinghR45/VibeSync or https://github.com/owner/repo/pull/12"
                    className="w-full pl-10 pr-10 py-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] text-xs font-mono focus:outline-none focus:border-blue-500 transition-colors shadow-inner"
                    disabled={isLoading}
                  />
                  {isInspecting && (
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Sample Presets */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
                <span className="text-[var(--text-muted)] font-mono text-[11px]">Quick Samples:</span>
                {SAMPLE_REPOS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => { setGithubUrl(sample.url); setErrorMsg(''); }}
                    className="px-3 py-1 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--border-strong)] text-blue-600 dark:text-blue-400 text-[11px] font-mono font-medium transition-colors"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>

              {/* Live Repository Explorer Card */}
              {repoMeta && (
                <div className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-blue-500/30 space-y-4 animate-fadeIn">
                  {/* Repo Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--border-subtle)]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[var(--text-primary)] font-mono">{repoMeta.full_name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                          {repoMeta.language}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">{repoMeta.description}</p>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] font-mono">
                      <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-500" /> {repoMeta.stars}</span>
                      <span className="flex items-center gap-1"><GitFork className="w-3.5 h-3.5" /> {repoMeta.forks}</span>
                      <span className="flex items-center gap-1"><GitBranch className="w-3.5 h-3.5 text-blue-600" /> {repoMeta.default_branch}</span>
                    </div>
                  </div>

                  {/* File Tree Explorer */}
                  {repoMeta.files && repoMeta.files.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--text-primary)] font-bold flex items-center gap-1.5">
                          <FolderTree className="w-3.5 h-3.5 text-blue-600" />
                          Repository Code Files ({selectedFiles.length} of {repoMeta.files.length} selected for audit)
                        </span>
                        <div className="flex items-center gap-2 text-[11px]">
                          <button type="button" onClick={selectAllFiles} className="text-blue-600 font-bold hover:underline">Select All</button>
                          <span>•</span>
                          <button type="button" onClick={deselectAllFiles} className="text-[var(--text-muted)] hover:underline">Deselect All</button>
                        </div>
                      </div>

                      {/* Filter File Search */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={fileFilter}
                          onChange={(e) => setFileFilter(e.target.value)}
                          placeholder="Filter repository code files..."
                          className="w-full pl-9 pr-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* File List */}
                      <div className="max-h-48 overflow-y-auto bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-2 space-y-1">
                        {filteredRepoFiles.map((file) => {
                          const isSelected = selectedFiles.includes(file.path);
                          return (
                            <div
                              key={file.path}
                              onClick={() => toggleFileSelection(file.path)}
                              className={`flex items-center justify-between p-2 rounded-lg text-xs font-mono cursor-pointer transition-colors ${
                                isSelected ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/30' : 'hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-transparent'
                              }`}
                            >
                              <span className="flex items-center gap-2 truncate">
                                {isSelected ? <CheckSquare className="w-3.5 h-3.5 text-blue-600 shrink-0" /> : <Square className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />}
                                <span className="truncate">{file.path}</span>
                              </span>
                              <span className="text-[10px] text-[var(--text-muted)] shrink-0 ml-2">{(file.size / 1024).toFixed(1)} KB</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : inputMode === 'file' ? (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Upload Source Code File
              </label>
              <div className="border-2 border-dashed border-[var(--border-subtle)] hover:border-blue-500/50 rounded-2xl p-10 text-center bg-[var(--bg-elevated)] transition-colors cursor-pointer relative">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept=".py,.js,.jsx,.ts,.tsx,.go,.rs,.java,.cpp,.c,.h,.sql"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-9 h-9 text-blue-600 mx-auto mb-2" />
                <h3 className="text-xs font-bold text-[var(--text-primary)]">
                  Click to browse or drag & drop code file
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  Supports .py, .js, .ts, .go, .rs, .java, .cpp, .sql (Max 2MB)
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[var(--text-primary)] uppercase text-[11px]">Monaco Code Editor</span>
                  {uploadedFileName && (
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 font-mono text-[10px]">
                      {uploadedFileName}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  {rawCode && (
                    <>
                      <button
                        type="button"
                        onClick={handleFormatCode}
                        className="text-blue-600 dark:text-blue-400 hover:underline transition-colors flex items-center gap-1 cursor-pointer font-bold"
                        title="Auto-format standard 4-space indentation"
                      >
                        <Sparkles className="w-3 h-3" /> Format & Indent
                      </button>
                      <button
                        type="button"
                        onClick={() => { setRawCode(''); setUploadedFileName(''); }}
                        className="text-[var(--text-muted)] hover:text-rose-500 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> Clear
                      </button>
                    </>
                  )}
                  <span>{rawCode.split('\n').length} lines</span>
                  <span className={rawCode.length > MAX_CHARS ? 'text-rose-500 font-bold' : ''}>
                    {rawCode.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} chars
                  </span>
                </div>
              </div>

              {/* Monaco-style Editor Window */}
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-editor)] overflow-hidden flex shadow-sm">
                <div className="code-line-gutter py-3.5 select-none border-r border-[var(--border-subtle)]">
                  {(rawCode ? rawCode.split('\n') : ['1']).map((_, i) => (
                    <div key={i} className="leading-5">{i + 1}</div>
                  ))}
                </div>
                <textarea
                  value={rawCode}
                  onChange={(e) => setRawCode(e.target.value)}
                  placeholder="// Paste code snippet or enter function definitions..."
                  rows={14}
                  className="flex-1 p-3.5 bg-transparent text-[var(--text-primary)] font-mono text-xs leading-5 focus:outline-none resize-y"
                  disabled={isLoading}
                />
              </div>

              {/* Single Unified DSA Problem Statement, Constraints & Image Attachment Card */}
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] overflow-hidden mt-3 shadow-sm">
                <button
                  type="button"
                  onClick={() => setShowDsaPanel(!showDsaPanel)}
                  className="w-full flex items-center justify-between p-3.5 px-4 text-left text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <Brain className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Problem Statement, Examples & Constraints (LeetCode / GFG)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 font-normal">
                      Single Field • Supports Screenshots/Images
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${showDsaPanel ? 'rotate-180' : ''}`} />
                </button>

                {showDsaPanel && (
                  <div className="p-4 pt-2 space-y-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs">
                    {/* Platform Presets */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-[var(--text-muted)] font-mono">Quick DSA Presets:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setProblemDescription('9. Palindrome Number (LeetCode)\nGiven an integer x, return true if x is a palindrome, and false otherwise.\n\nExample 1: Input: x = 121, Output: true\nExample 2: Input: x = -121, Output: false\nExample 3: Input: x = 10, Output: false\n\nConstraints: -2^31 <= x <= 2^31 - 1. Follow up: Could you solve it without converting the integer to a string?');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] hover:bg-blue-500/10 hover:text-blue-600 font-mono text-[10px] text-[var(--text-secondary)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
                      >
                        9. Palindrome Number
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setProblemDescription('743. Network Delay Time\nYou are given a network of n nodes, labeled from 1 to n. You are also given times, a list of travel times as directed edges times[i] = (ui, vi, wi).\nWe will send a signal from a given node k. Return the minimum time it takes for all the n nodes to receive the signal.\n\nConstraints:\n1 <= k <= n <= 100\n1 <= times.length <= 6000\nTarget: Dijkstra O((V+E)logV)');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] hover:bg-blue-500/10 hover:text-blue-600 font-mono text-[10px] text-[var(--text-secondary)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
                      >
                        743. Network Delay Time (Dijkstra)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setProblemDescription('53. Maximum Subarray\nGiven an integer array nums, find the subarray with the largest sum, and return its sum.\n\nExample 1: nums = [-2,1,-3,4,-1,2,1,-5,4], Output: 6 (4 + -1 + 2 + 1)\nConstraints: 1 <= nums.length <= 10^5, -10^4 <= nums[i] <= 10^4. Target: O(N) Kadane');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] hover:bg-blue-500/10 hover:text-blue-600 font-mono text-[10px] text-[var(--text-secondary)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
                      >
                        53. Maximum Subarray (Kadane)
                      </button>
                    </div>

                    {/* Single Unified Problem Statement & Constraints Textarea */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                        <label className="font-semibold">Problem Description, Examples & Constraints</label>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">Paste directly from LeetCode / GFG</span>
                      </div>
                      <textarea
                        rows={4}
                        value={problemDescription}
                        onChange={(e) => setProblemDescription(e.target.value)}
                        onPaste={(e) => {
                          const items = e.clipboardData?.items;
                          if (items) {
                            for (let i = 0; i < items.length; i++) {
                              if (items[i].type.indexOf('image') !== -1) {
                                const file = items[i].getAsFile();
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    setProblemImage(event.target.result);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }
                            }
                          }
                        }}
                        placeholder="Paste problem description, examples and constraints here (or press Ctrl+V to paste graph/tree screenshot)..."
                        className="w-full p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-500 font-mono leading-relaxed resize-y"
                      />
                    </div>

                    {/* Image Attachment Bar */}
                    <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                      <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shadow-sm">
                        <ImagePlus className="w-3.5 h-3.5 text-blue-600" />
                        <span>Attach Problem Diagram / Graph Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setProblemImage(event.target.result);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>

                      {problemImage && (
                        <div className="flex items-center gap-2 p-1.5 px-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                          <img src={problemImage} alt="Diagram Preview" className="w-8 h-8 rounded object-cover border border-blue-500/30" />
                          <span className="text-[10px] font-mono text-blue-600 font-bold">Image Attached</span>
                          <button
                            type="button"
                            onClick={() => setProblemImage('')}
                            className="p-1 text-[var(--text-muted)] hover:text-rose-500 transition-colors cursor-pointer"
                            title="Remove Image"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Live Execution Console */}
          {isLoading && (
            <div className="rounded-2xl p-4 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between text-xs border-b border-[var(--border-subtle)] pb-2 text-[var(--text-primary)] font-mono">
                <span className="flex items-center gap-2">
                  <TerminalIcon className="w-3.5 h-3.5 text-blue-600" />
                  Live Parallel Execution Stream
                </span>
                <span className="text-blue-600 font-bold flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Step {loadingStep} / 4
                </span>
              </div>

              <div className="space-y-1 font-mono text-[11px] text-[var(--text-muted)] max-h-36 overflow-y-auto">
                {terminalLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">❯</span>
                    <span className="text-[var(--text-primary)]">{log}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="flex items-center justify-between pt-2">
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-[var(--text-muted)] font-mono">
              <span>Press</span>
              <span className="kbd-shortcut">Ctrl</span>
              <span className="kbd-shortcut">Enter</span>
              <span>to execute</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="syncra-btn-primary px-7 py-3 flex items-center gap-2 text-xs shadow-lg cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Auditing via Parallel Agents...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Run Multi-Agent Review
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
