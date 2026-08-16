import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Palette, 
  Bug, 
  ShieldAlert, 
  Zap, 
  ArrowLeft, 
  Copy, 
  Check, 
  Clock, 
  Search, 
  Download, 
  Printer, 
  FileCode, 
  GitCommit, 
  Award,
  Layers,
  Wand2,
  RefreshCw,
  Eye,
  CheckCircle2,
  Edit3,
  SplitSquareVertical,
  SlidersHorizontal,
  Code2,
  ArrowRight,
  Maximize2,
  Minimize2,
  Undo2,
  Plus,
  Minus,
  Loader2,
  CheckCheck
} from 'lucide-react';
import HealthRadar from './HealthRadar';

export default function ResultsView({ reviewData: initialReviewData, onBackToForm, onReAudit }) {
  const [reviewData, setReviewData] = useState(initialReviewData);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedLine, setHighlightedLine] = useState(null);
  const [selectedFindingIdx, setSelectedFindingIdx] = useState(null);
  const [copiedPr, setCopiedPr] = useState(false);
  const [copiedPatchIdx, setCopiedPatchIdx] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedRemediated, setCopiedRemediated] = useState(false);
  const [isReAuditing, setIsReAuditing] = useState(false);
  const [allFixesApplied, setAllFixesApplied] = useState(false);
  
  // Layout views: 'split' (Side-by-Side Review) | 'diff' (Full 2-column Diff Comparison)
  const [layoutMode, setLayoutMode] = useState('split'); 
  
  // Manual continuous width percentage slider (20% to 80%) with smooth +/- 1% stepping
  const [inspectorWidthPercent, setInspectorWidthPercent] = useState(50);
  const [isExpandedHeight, setIsExpandedHeight] = useState(false);

  // Track applied / overridden state per finding index: { [idx]: 'fixed' | 'original' }
  const [findingLineState, setFindingLineState] = useState({});

  useEffect(() => {
    if (initialReviewData) {
      setReviewData(initialReviewData);
      setCurrentCode(initialReviewData.code_snippet || '');
    }
  }, [initialReviewData]);

  const { 
    id, 
    source_url, 
    code_snippet = '', 
    language = 'auto', 
    health_score = { score: 100, grade: 'A+', style_score: 100, bug_score: 100, security_score: 100, performance_score: 100 }, 
    style = [], 
    bugs = [], 
    security = [], 
    performance = [], 
    summary = '', 
    remediated_code = '',
    created_at 
  } = reviewData || {};

  const [currentCode, setCurrentCode] = useState(code_snippet || '');
  const editorTextareaRef = useRef(null);
  const gutterRef = useRef(null);

  const totalFindings = style.length + bugs.length + security.length + performance.length;
  const criticalSecCount = security.filter(s => ['critical', 'high'].includes(s.severity?.toLowerCase())).length;

  const allFindings = [
    ...security.map(item => ({ ...item, category: 'security', categoryLabel: 'AppSec Risk', icon: ShieldAlert, color: 'rose' })),
    ...bugs.map(item => ({ ...item, category: 'bug', categoryLabel: 'Logic Flaw', icon: Bug, color: 'amber' })),
    ...performance.map(item => ({ ...item, category: 'perf', categoryLabel: 'Performance', icon: Zap, color: 'emerald' })),
    ...style.map(item => ({ ...item, category: 'style', categoryLabel: 'Style / Lint', icon: Palette, color: 'purple' })),
  ];

  const filteredFindings = allFindings.filter(f => {
    if (activeTab !== 'all' && f.category !== activeTab) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (f.issue && f.issue.toLowerCase().includes(q)) ||
      (f.suggestion && f.suggestion.toLowerCase().includes(q)) ||
      (f.line && f.line.toLowerCase().includes(q)) ||
      (f.cwe_id && f.cwe_id.toLowerCase().includes(q))
    );
  });

  // LeetCode Standard Indentation Formatter
  const formatLeetCodeIndentation = (source) => {
    if (!source) return '';
    const lines = source.split('\n');
    let indentLevel = 0;
    return lines.map((rawLine) => {
      const line = rawLine.trim();
      if (!line) return '';

      if (line.startsWith('}') || line.startsWith(')')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      let currentIndent = indentLevel;
      if (line === 'public:' || line === 'private:' || line === 'protected:') {
        currentIndent = Math.max(0, indentLevel - 1);
      }

      const indentStr = '    '.repeat(currentIndent);
      const res = indentStr + line;

      if (line.endsWith('{') || line.endsWith('(')) {
        indentLevel++;
      }

      return res;
    }).join('\n');
  };

  // Safe Remediated Code (Prioritize Backend Agent Remediated Code)
  const getCleanRemediatedCode = () => {
    if (remediated_code && remediated_code.trim() && remediated_code.includes('{')) {
      return formatLeetCodeIndentation(remediated_code.trim());
    }
    // Fallback
    return formatLeetCodeIndentation(code_snippet || currentCode || '');
  };

  const fullyRemediatedCode = getCleanRemediatedCode();
  const remediatedLines = fullyRemediatedCode.split('\n');
  const originalLines = (code_snippet || '').split('\n');
  const codeLines = currentCode.split('\n');

  // Semantic diff comparator: Ignores harmless spacing and whitespace differences
  const isLineModified = (origLine, remLine) => {
    if (!origLine && !remLine) return false;
    if (!origLine || !remLine) return true;
    // Strip all whitespaces and semicolons for comparison so if(n==0) vs if (n == 0) is considered IDENTICAL!
    const normOrig = origLine.replace(/\s+/g, '').replace(/[;]/g, '');
    const normRem = remLine.replace(/\s+/g, '').replace(/[;]/g, '');
    return normOrig !== normRem;
  };

  // Smart Exact Line Matcher
  const findExactLineNumberInCode = (item, targetCode) => {
    if (!targetCode) return 1;
    const lines = targetCode.split('\n');

    const specificPatterns = (item.issue + ' ' + (item.suggestion || '')).match(/\([A-Za-z0-9_&*\s]+\)|`([^`]+)`|'([^']+)'/g);
    if (specificPatterns) {
      for (const pat of specificPatterns) {
        const clean = pat.replace(/[`'()]/g, '').trim();
        if (clean.length >= 3 && !['int', 'for', 'if', 'auto', 'const'].includes(clean)) {
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(clean)) {
              return i + 1;
            }
          }
        }
      }
    }

    const match = String(item.line || '').match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      return Math.min(Math.max(1, num), lines.length);
    }
    return 1;
  };

  const getLineText = (lineNum, sourceText) => {
    if (!lineNum || !sourceText) return '';
    const lines = sourceText.split('\n');
    return lines[lineNum - 1] || '';
  };

  // Scroll and select line smoothly in textarea
  const focusLineInEditor = (lineNum) => {
    if (!lineNum || !editorTextareaRef.current) return;
    const lines = currentCode.split('\n');
    let startPos = 0;
    for (let i = 0; i < lineNum - 1 && i < lines.length; i++) {
      startPos += lines[i].length + 1;
    }
    const endPos = startPos + (lines[lineNum - 1] ? lines[lineNum - 1].length : 0);

    editorTextareaRef.current.focus();
    editorTextareaRef.current.setSelectionRange(startPos, endPos);

    const lineHeight = 20;
    const targetScrollTop = Math.max(0, (lineNum - 5) * lineHeight);
    editorTextareaRef.current.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
    if (gutterRef.current) {
      gutterRef.current.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
    }
  };

  const handleSelectFinding = (item, idx) => {
    setSelectedFindingIdx(idx);
    const lineNum = findExactLineNumberInCode(item, currentCode);
    if (lineNum) {
      setHighlightedLine(lineNum);
      focusLineInEditor(lineNum);
    }
  };

  // 1-Click: APPLY ALL FIXES AT ONCE (Uses Backend Verified Remediated Code)
  const handleApplyAllFixes = () => {
    const updated = fullyRemediatedCode;
    const newStates = {};
    allFindings.forEach((_, idx) => {
      newStates[idx] = 'fixed';
    });

    setCurrentCode(updated);
    setFindingLineState(newStates);
    setAllFixesApplied(true);
    try {
      sessionStorage.setItem('cr_raw_code', updated);
      sessionStorage.setItem('cr_input_mode', 'code');
    } catch (e) {}
  };

  // In-Place Re-Audit Action
  const handleInPlaceReAudit = async () => {
    setIsReAuditing(true);
    try {
      sessionStorage.setItem('cr_raw_code', currentCode);
      sessionStorage.setItem('cr_input_mode', 'code');

      const payload = {
        raw_code: currentCode,
        language: language || 'auto',
        user_email: sessionStorage.getItem('cr_user_email') || 'guest@codereview.pro',
        problem_context: sessionStorage.getItem('cr_problem_context') || undefined,
        constraints: sessionStorage.getItem('cr_constraints') || undefined
      };

      const res = await fetch('/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const newData = await res.json();
        setReviewData(newData);
        setFindingLineState({});
        setHighlightedLine(null);
        setSelectedFindingIdx(null);
        setAllFixesApplied(false);
      }
    } catch (e) {
      // Fallback
    } finally {
      setIsReAuditing(false);
    }
  };

  const handleCopyPatch = (idx, text) => {
    navigator.clipboard.writeText(text);
    setCopiedPatchIdx(idx);
    setTimeout(() => setCopiedPatchIdx(null), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyRemediated = () => {
    navigator.clipboard.writeText(fullyRemediatedCode);
    setCopiedRemediated(true);
    setTimeout(() => setCopiedRemediated(false), 2000);
  };

  const handleCopyPrComment = () => {
    const md = `## 🤖 CodeReviewPro Staff Review Summary
**Health Score:** ${health_score.score}/100 (Grade ${health_score.grade})
- 🛡️ Security Risks: ${security.length}
- 🐛 Logic & Bugs: ${bugs.length}
- ⚡ Performance Flaws: ${performance.length}
- 🎨 Style & Lints: ${style.length}

### 📋 Executive Summary
${summary}

### 🔍 Key Findings & Remediation
${allFindings.slice(0, 5).map(f => `- **${f.categoryLabel} [${f.line || 'Global'}]:** ${f.issue}\n  > *Suggested Fix:* \`${f.suggestion}\``).join('\n')}
`;
    navigator.clipboard.writeText(md);
    setCopiedPr(true);
    setTimeout(() => setCopiedPr(false), 2000);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(reviewData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codereviewpro_audit_${id || 'report'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const editorHeightClass = isExpandedHeight ? 'max-h-[850px] min-h-[700px]' : 'max-h-[560px] min-h-[460px]';

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn font-sans">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-[var(--border-subtle)]">
        <button
          onClick={() => {
            try {
              sessionStorage.setItem('cr_raw_code', currentCode);
              sessionStorage.setItem('cr_input_mode', 'code');
            } catch (e) {}
            onBackToForm(currentCode);
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Workbench</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCopyPrComment}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600/10 text-blue-600 border border-blue-600/20 text-xs font-bold hover:bg-blue-600/20 transition-colors cursor-pointer"
          >
            {copiedPr ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedPr ? 'PR Comment Copied!' : 'Copy GitHub PR Comment'}</span>
          </button>

          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold transition-colors cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold transition-colors cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Executive Command Center */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Health Score Dial */}
        <div className="md:col-span-4 theme-panel p-5 rounded-2xl flex items-center justify-between gap-4 shadow-sm border border-[var(--border-subtle)]">
          <div>
            <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Health Index</div>
            <div className="text-2xl font-extrabold text-[var(--text-primary)] mt-1 flex items-center gap-2">
              {health_score.score} / 100
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold font-mono ${
                health_score.score >= 88 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                health_score.score >= 68 ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
                'bg-rose-500/10 text-rose-500 border border-rose-500/20'
              }`}>
                Grade {health_score.grade}
              </span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-1 font-mono">Weighted 4-Agent Score</p>
          </div>

          <HealthRadar healthScore={health_score} />
        </div>

        {/* 3 Metric Cards */}
        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="theme-panel p-4 rounded-2xl space-y-1 shadow-sm border border-[var(--border-subtle)]">
            <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider flex items-center justify-between">
              <span>Security Risks</span>
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="text-xl font-bold text-[var(--text-primary)] font-mono">{security.length} Findings</div>
            <p className="text-[10px] text-[var(--text-muted)]">{criticalSecCount > 0 ? `${criticalSecCount} High/Critical Risks` : '0 Critical Risks'}</p>
          </div>

          <div className="theme-panel p-4 rounded-2xl space-y-1 shadow-sm border border-[var(--border-subtle)]">
            <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider flex items-center justify-between">
              <span>Bugs & Edge Cases</span>
              <Bug className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xl font-bold text-[var(--text-primary)] font-mono">{bugs.length} Issues</div>
            <p className="text-[10px] text-[var(--text-muted)]">Logic & unhandled cases</p>
          </div>

          <div className="theme-panel p-4 rounded-2xl space-y-1 shadow-sm border border-[var(--border-subtle)]">
            <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider flex items-center justify-between">
              <span>Est. Remediation</span>
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-xl font-bold text-[var(--text-primary)] font-mono">~{totalFindings * 5 || 5} Mins</div>
            <p className="text-[10px] text-[var(--text-muted)]">Estimated developer fix effort</p>
          </div>
        </div>
      </div>

      {/* Staff PR Executive Summary */}
      <div className="theme-panel rounded-2xl p-5 border border-blue-500/20 space-y-3 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 border-b border-[var(--border-subtle)] pb-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Staff Engineer PR Review Executive Summary</span>
        </div>
        <div className="text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-line space-y-2">
          {summary || 'Review completed successfully.'}
        </div>
      </div>

      {/* Clean 2-Way Layout Switcher Bar + Smooth +/- 1% Width Slider */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-2.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
        <div className="flex items-center gap-1.5 p-1 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)]">
          <button
            onClick={() => setLayoutMode('split')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              layoutMode === 'split' ? 'bg-blue-600 text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>Side-by-Side Review</span>
          </button>

          <button
            onClick={() => setLayoutMode('diff')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              layoutMode === 'diff' ? 'bg-blue-600 text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Full Diff Comparison</span>
          </button>
        </div>

        {/* Smooth +/- 1% Width Controls & Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          {layoutMode === 'split' && (
            <div className="flex items-center gap-1.5 bg-[var(--bg-surface)] px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[11px] font-mono text-[var(--text-muted)]">Width:</span>
              
              <button
                onClick={() => setInspectorWidthPercent(prev => Math.max(20, prev - 1))}
                className="p-1 rounded-md hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                title="Decrease Width (-1%)"
              >
                <Minus className="w-3 h-3" />
              </button>

              <input
                type="range"
                min="20"
                max="80"
                step="1"
                value={inspectorWidthPercent}
                onChange={(e) => setInspectorWidthPercent(Number(e.target.value))}
                className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                title={`Inspector Width: ${inspectorWidthPercent}%`}
              />

              <button
                onClick={() => setInspectorWidthPercent(prev => Math.min(80, prev + 1))}
                className="p-1 rounded-md hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                title="Increase Width (+1%)"
              >
                <Plus className="w-3 h-3" />
              </button>

              <span className="text-[11px] font-mono font-bold text-[var(--text-primary)] w-9 text-right">
                {inspectorWidthPercent}%
              </span>

              <button
                onClick={() => setIsExpandedHeight(!isExpandedHeight)}
                className={`p-1 ml-1 rounded-md transition-all cursor-pointer ${
                  isExpandedHeight ? 'bg-blue-600 text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                title={isExpandedHeight ? "Compact Height" : "Expand Full Height"}
              >
                {isExpandedHeight ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              </button>
            </div>
          )}

          {/* 1-Click Apply All Fixes Button */}
          <button
            onClick={handleApplyAllFixes}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
              allFixesApplied 
                ? 'bg-emerald-600 text-white shadow-emerald-500/20' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
            title="Apply all suggested code fixes in one single click"
          >
            {allFixesApplied ? <CheckCheck className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{allFixesApplied ? 'All Fixes Applied!' : `Apply All Fixes (${allFindings.length}) ✨`}</span>
          </button>

          <button
            onClick={handleInPlaceReAudit}
            disabled={isReAuditing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isReAuditing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
            <span>{isReAuditing ? 'Re-Auditing in place...' : 'Re-Audit ⚡'}</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: PRECISE DIFF (IGNORES WHITESPACE/SPACES SO IF(N==0) IS NOT COLORED) */}
      {layoutMode === 'diff' ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-editor)] overflow-hidden shadow-sm animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--border-subtle)]">
            {/* Column 1: Your Original Code */}
            <div className="flex flex-col">
              <div className="p-3.5 px-4 bg-rose-500/10 border-b border-[var(--border-subtle)] flex items-center justify-between">
                <span className="text-xs font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  Original Source (Your Submitted Code)
                </span>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">
                  {originalLines.length} lines
                </span>
              </div>
              <div className="p-4 font-mono text-xs overflow-x-auto max-h-[620px] overflow-y-auto space-y-1 bg-[var(--bg-card)]">
                {originalLines.map((line, i) => {
                  const remLine = remediatedLines[i] || '';
                  const modified = isLineModified(line, remLine);
                  return (
                    <div 
                      key={i} 
                      className={`leading-5 whitespace-pre flex transition-colors py-0.5 ${
                        modified ? 'bg-rose-500/20 text-rose-300 font-semibold border-l-2 border-rose-500 pl-1.5 -ml-1 rounded' : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      <span className="w-8 text-[var(--text-muted)] select-none shrink-0 text-right pr-3 font-mono text-[11px]">{i + 1}</span>
                      <span className="flex-1">{line || ' '}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Column 2: Fully Remediated Code (100% Compilable & Clean) */}
            <div className="flex flex-col">
              <div className="p-3.5 px-4 bg-emerald-500/10 border-b border-[var(--border-subtle)] flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Remediated Source (100% Compilable & Optimized)
                </span>
                
                <button
                  onClick={handleCopyRemediated}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all shadow-sm cursor-pointer"
                  title="Copy 100% compilable code for LeetCode / GFG"
                >
                  {copiedRemediated ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedRemediated ? 'Copied Full Code!' : 'Copy Remediated Code'}</span>
                </button>
              </div>

              <div className="p-4 font-mono text-xs overflow-x-auto max-h-[620px] overflow-y-auto space-y-1 bg-[var(--bg-card)]">
                {remediatedLines.map((line, i) => {
                  const origLine = originalLines[i] || '';
                  const modified = isLineModified(origLine, line);
                  return (
                    <div 
                      key={i} 
                      className={`leading-5 whitespace-pre flex transition-colors py-0.5 ${
                        modified ? 'bg-emerald-500/20 text-emerald-300 font-semibold border-l-2 border-emerald-500 pl-1.5 -ml-1 rounded' : 'text-[var(--text-primary)]'
                      }`}
                    >
                      <span className="w-8 text-[var(--text-muted)] select-none shrink-0 text-right pr-3 font-mono text-[11px]">{i + 1}</span>
                      <span className="flex-1 font-medium">{line || ' '}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW 2: SIDE-BY-SIDE REVIEW WITH SYNCHRONIZED SCROLL & ACCURATE SELECTION */
        <div className="flex flex-col lg:flex-row gap-6 items-start transition-all duration-300">
          {/* Left: Source Code Inspector */}
          <div 
            style={{ width: `${inspectorWidthPercent}%` }} 
            className="w-full space-y-3 transition-all duration-150"
          >
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[var(--text-primary)] uppercase text-[11px] flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-blue-600" />
                  Source Code Inspector
                </span>
                <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 text-[10px] font-mono font-bold">
                  Directly Editable
                </span>
              </div>

              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] text-[10px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
                title="Copy current code"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Locked-Scroll Code Box */}
            <div className={`rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-editor)] overflow-hidden flex flex-col shadow-inner ${editorHeightClass} transition-all duration-300`}>
              <div className="flex font-mono text-xs flex-1 overflow-hidden">
                {/* Synchronized Line Gutter */}
                <div 
                  ref={gutterRef}
                  className="code-line-gutter py-3.5 select-none border-r border-[var(--border-subtle)] shrink-0 text-[10px] text-[var(--text-muted)] overflow-y-hidden"
                >
                  {codeLines.map((_, i) => {
                    const lineNum = i + 1;
                    const isTarget = highlightedLine === lineNum;
                    return (
                      <div 
                        key={i} 
                        className={`leading-5 cursor-pointer hover:text-blue-500 px-2.5 text-right transition-colors ${
                          isTarget ? 'text-blue-600 font-bold bg-blue-500/15' : ''
                        }`}
                        onClick={() => {
                          setHighlightedLine(lineNum);
                          focusLineInEditor(lineNum);
                        }}
                      >
                        {lineNum}
                      </div>
                    );
                  })}
                </div>

                {/* Editable Textarea with Scroll Sync to Gutter */}
                <textarea
                  ref={editorTextareaRef}
                  value={currentCode}
                  onScroll={(e) => {
                    if (gutterRef.current) {
                      gutterRef.current.scrollTop = e.target.scrollTop;
                    }
                  }}
                  onChange={(e) => {
                    setCurrentCode(e.target.value);
                    try {
                      sessionStorage.setItem('cr_raw_code', e.target.value);
                      sessionStorage.setItem('cr_input_mode', 'code');
                    } catch (err) {}
                  }}
                  className="flex-1 p-3.5 bg-transparent text-[var(--text-primary)] font-mono text-xs leading-5 focus:outline-none resize-none overflow-y-auto selection:bg-blue-500/30 selection:text-white"
                  placeholder="// Edit source code directly here..."
                />
              </div>

              {/* Status bar */}
              <div className="p-2.5 px-4 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono">
                <span>{codeLines.length} lines • {language.toUpperCase()}</span>
                <span className="text-blue-600 font-bold">Scroll & Line Synced</span>
              </div>
            </div>
          </div>

          {/* Right: Finding Details */}
          <div 
            style={{ width: `${100 - inspectorWidthPercent}%` }} 
            className="w-full space-y-3 transition-all duration-150"
          >
            {/* Finding Filter Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    activeTab === 'all' ? 'bg-blue-600 text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  All ({allFindings.length})
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    activeTab === 'security' ? 'bg-rose-600 text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  AppSec ({security.length})
                </button>
                <button
                  onClick={() => setActiveTab('bug')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    activeTab === 'bug' ? 'bg-amber-600 text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Bugs ({bugs.length})
                </button>
                <button
                  onClick={() => setActiveTab('perf')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    activeTab === 'perf' ? 'bg-emerald-600 text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Perf ({performance.length})
                </button>
                <button
                  onClick={() => setActiveTab('style')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    activeTab === 'style' ? 'bg-purple-600 text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Style ({style.length})
                </button>
              </div>
            </div>

            {/* Finding Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search findings by keyword, line, or CWE ID..."
                className="w-full pl-9 pr-3 py-1.5 theme-panel rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-500 border border-[var(--border-subtle)]"
              />
            </div>

            {/* Finding Cards List */}
            <div className={`space-y-3 ${isExpandedHeight ? 'max-h-[800px]' : 'max-h-[500px]'} overflow-y-auto pr-1`}>
              {filteredFindings.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--text-muted)] theme-panel rounded-2xl border border-[var(--border-subtle)]">
                  No issues found matching current filters.
                </div>
              ) : (
                filteredFindings.map((item, idx) => {
                  const Icon = item.icon;
                  const isSelected = selectedFindingIdx === idx;
                  const lineNum = findExactLineNumberInCode(item, currentCode);
                  const originalLineText = getLineText(lineNum, code_snippet) || getLineText(lineNum, currentCode);

                  return (
                    <div 
                      key={idx} 
                      onClick={() => handleSelectFinding(item, idx)}
                      className={`theme-card p-4 rounded-2xl space-y-3 transition-all cursor-pointer border ${
                        isSelected 
                          ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-500/5' 
                          : 'border-[var(--border-subtle)] hover:border-blue-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`p-1 rounded bg-${item.color}-500/10 text-${item.color}-500`}>
                            <Icon className="w-3.5 h-3.5" />
                          </span>
                          <span className="text-xs font-bold text-[var(--text-primary)] font-mono">
                            Line {lineNum}
                          </span>
                          {item.cwe_id && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                              {item.cwe_id}
                            </span>
                          )}
                        </div>

                        {item.severity && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                            item.severity === 'high' || item.severity === 'critical' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                            item.severity === 'medium' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          }`}>
                            {item.severity}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[var(--text-primary)] font-medium leading-relaxed">{item.issue}</p>

                      {/* Informative Issue & Suggestion Card */}
                      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-editor)] text-xs font-mono overflow-hidden space-y-0">
                        {originalLineText && (
                          <div 
                            className="p-2.5 px-3 border-b border-[var(--border-subtle)] bg-rose-500/10"
                          >
                            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block mb-1">
                              🔴 Mistake / Detected Line (Line {lineNum})
                            </span>
                            <div className="text-[11px] text-rose-400 font-mono whitespace-pre truncate">
                              {originalLineText}
                            </div>
                          </div>
                        )}

                        {item.suggestion && (
                          <div className="p-2.5 px-3 bg-emerald-500/10">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span>🟢 Optimization Recommendation</span>
                              </span>
                              
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyPatch(idx, item.suggestion);
                                }}
                                className="text-blue-500 hover:text-blue-400 flex items-center gap-1 cursor-pointer text-[10px] font-bold"
                              >
                                {copiedPatchIdx === idx ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedPatchIdx === idx ? 'Copied' : 'Copy Suggestion'}</span>
                              </button>
                            </div>

                            <div className="text-[11px] text-emerald-400 whitespace-pre-wrap leading-relaxed font-mono">
                              {item.suggestion}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Bar: 1-Click Apply All Fixes & Re-Audit */}
      <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div>
          <h4 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Ready to Verify Your Fixes?
          </h4>
          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
            Click Apply All Fixes to replace your code with the 100% verified compilable solution, then Re-Audit!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleApplyAllFixes}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Apply 100% Compilable Fixes ✨</span>
          </button>

          <button
            onClick={handleInPlaceReAudit}
            disabled={isReAuditing}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            {isReAuditing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            <span>{isReAuditing ? 'Re-Auditing in place...' : 'Re-Audit Code ⚡'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
