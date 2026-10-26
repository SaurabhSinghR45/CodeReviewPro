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
  Layers, 
  CheckCircle2,
  SplitSquareVertical,
  SlidersHorizontal,
  Maximize2,
  Minimize2,
  Plus,
  Minus,
  Loader2,
  CheckCheck,
  MessageSquareQuote,
  Wand2,
  AlertTriangle
} from 'lucide-react';
import HealthRadar from './HealthRadar';
import { 
  DEMO_REMEDIATED_CODE, 
  DEMO_PERFECT_REVIEW,
  isAnyDemoSample,
  getDemoReviewForCode
} from '../data/demoReview';

export default function ResultsView({ reviewData: initialReviewData, onBackToForm, onReAudit }) {
  const [reviewData, setReviewData] = useState(initialReviewData);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedLine, setHighlightedLine] = useState(null);
  const [selectedFindingIdx, setSelectedFindingIdx] = useState(null);
  const [copiedPr, setCopiedPr] = useState(false);
  const [copiedCodeMode, setCopiedCodeMode] = useState(null); // 'clean' | 'comments'
  const [copiedRemediatedMode, setCopiedRemediatedMode] = useState(null); // 'clean' | 'comments'
  const [isReAuditing, setIsReAuditing] = useState(false);
  const [allFixesApplied, setAllFixesApplied] = useState(false);
  
  // Layout views: 'split' (Side-by-Side Review) | 'diff' (Full 2-column Diff Comparison)
  const [layoutMode, setLayoutMode] = useState('split'); 
  
  // Manual continuous width percentage slider (20% to 80%) with smooth +/- 1% stepping
  const [inspectorWidthPercent, setInspectorWidthPercent] = useState(55);
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
    ...security.map((item, i) => ({ ...item, findingId: item.id || `sec_${i}`, category: 'security', categoryLabel: 'AppSec Risk', icon: ShieldAlert, color: 'rose' })),
    ...bugs.map((item, i) => ({ ...item, findingId: item.id || `bug_${i}`, category: 'bug', categoryLabel: 'Logic Flaw', icon: Bug, color: 'amber' })),
    ...performance.map((item, i) => ({ ...item, findingId: item.id || `perf_${i}`, category: 'perf', categoryLabel: 'Performance', icon: Zap, color: 'emerald' })),
    ...style.map((item, i) => ({ ...item, findingId: item.id || `style_${i}`, category: 'style', categoryLabel: 'Style / Lint', icon: Palette, color: 'purple' })),
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

  // Strip comments helper (For pure code copy)
  const stripComments = (source) => {
    if (!source) return '';
    return source
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter(line => !line.trim().startsWith('//'))
      .join('\n')
      .replace(/\n\s*\n\s*\n/g, '\n\n');
  };

  // Safe Remediated Code (Prioritize Backend Agent Remediated Code)
  const getCleanRemediatedCode = () => {
    let source = (remediated_code && remediated_code.trim())
      ? remediated_code.trim()
      : (code_snippet || currentCode || '');

    const orig = code_snippet || currentCode || '';
    const origHasHeaders = /^\s*#?\s*include\b/m.test(orig);
    const origHasUsingStd = /^\s*using\s+namespace\s+std\s*;/m.test(orig);

    if (!origHasHeaders) {
      source = source.replace(/^\s*#?\s*include\s*<[^>]+>\s*$/gm, '');
    }
    if (!origHasUsingStd) {
      source = source.replace(/^\s*using\s+namespace\s+std\s*;\s*$/gm, '');
    }

    return formatLeetCodeIndentation(source.trim());
  };

  const fullyRemediatedCode = getCleanRemediatedCode();
  const remediatedLines = fullyRemediatedCode.split('\n');
  const originalLines = (code_snippet || '').split('\n');
  const codeLines = currentCode.split('\n');

  // Update Code in editor and sessionStorage
  const updateCode = (newCode) => {
    setCurrentCode(newCode);
    try {
      sessionStorage.setItem('cr_raw_code', newCode);
      sessionStorage.setItem('cr_input_mode', 'code');
    } catch (e) {}
  };

  // LCS (Longest Common Subsequence) based Diff Engine
  // Prevents offset-shifting from coloring the entire file
  const computePreciseDiff = (origLines, remLines) => {
    const norm = (s) => (s || '').replace(/\s+/g, '').replace(/[;]/g, '');

    const n = origLines.length;
    const m = remLines.length;
    const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        if (norm(origLines[i]) === norm(remLines[j]) && norm(origLines[i]).length > 0) {
          dp[i + 1][j + 1] = dp[i][j] + 1;
        } else {
          dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
        }
      }
    }

    // Backtrack LCS matches
    const matchedOrig = new Set();
    const matchedRem = new Set();
    let i = n, j = m;
    while (i > 0 && j > 0) {
      if (norm(origLines[i - 1]) === norm(remLines[j - 1]) && norm(origLines[i - 1]).length > 0) {
        matchedOrig.add(i - 1);
        matchedRem.add(j - 1);
        i--;
        j--;
      } else if (dp[i - 1][j] >= dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }

    // Classify Original Lines
    const leftRows = origLines.map((line, idx) => {
      const isBlank = !line.trim();
      const isCommon = isBlank || matchedOrig.has(idx);
      return {
        lineNum: idx + 1,
        text: line,
        status: isCommon ? 'normal' : 'error' // 🔴 Red for mistakes only
      };
    });

    // Classify Remediated Lines
    const rightRows = remLines.map((line, idx) => {
      const isBlank = !line.trim();
      const isCommon = isBlank || matchedRem.has(idx);
      let status = 'normal';

      if (!isCommon) {
        // If line is an import / header or totally new guard clause -> 'extra' (🔵 Blue)
        if (line.includes('#include') || line.includes('import ') || line.includes('INT_MAX') || line.includes('limits')) {
          status = 'extra'; // 🔵 Cyan/Indigo for extra helper lines
        } else {
          status = 'fixed'; // 🟢 Green for corrected lines
        }
      }

      return {
        lineNum: idx + 1,
        text: line,
        status
      };
    });

    return { leftRows, rightRows };
  };

  const { leftRows: originalDiffRows, rightRows: remediatedDiffRows } = computePreciseDiff(originalLines, remediatedLines);

  // Smart Exact Line Matcher
  const findExactLineNumberInCode = (item, targetCode) => {
    if (!targetCode) return 1;
    const lines = targetCode.split('\n');

    // 0. Priority: Explicit detected_line
    if (item.detected_line && typeof item.detected_line === 'string') {
      const needle = item.detected_line.trim();
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(needle)) {
          return i + 1;
        }
      }
    }

    // 1. Priority: First line of target_snippet
    if (item.target_snippet && typeof item.target_snippet === 'string') {
      const firstLine = item.target_snippet.trim().split('\n')[0].trim();
      if (firstLine.length >= 4) {
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(firstLine)) {
            return i + 1;
          }
        }
      }
    }

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
      gutterRef.current.scrollTop = targetScrollTop;
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

  // 🔴 Red: Revert that specific line to the user's original submission
  const handleToggleMistakeLine = (item, key) => {
    const findingKey = key || item.findingId || item.id;
    const state = findingLineState[findingKey];
    const lineNum = findExactLineNumberInCode(item, currentCode);

    if (state && typeof state === 'object' && state.status === 'fixed') {
      if (state.type === 'block' && state.origSnippet && state.newSnippet) {
        const updated = currentCode.replace(state.newSnippet, state.origSnippet);
        updateCode(updated);
        setFindingLineState(prev => ({ ...prev, [findingKey]: 'original' }));
      } else if (state.type === 'inserted' && state.insertedText) {
        const lines = currentCode.split('\n');
        const matchIdx = lines.findIndex(l => l.trim() === state.insertedText.trim());
        if (matchIdx !== -1) {
          lines.splice(matchIdx, 1);
          updateCode(lines.join('\n'));
        }
        setFindingLineState(prev => ({ ...prev, [findingKey]: 'original' }));
      } else if (state.type === 'replaced' && state.origLine !== undefined) {
        const lines = currentCode.split('\n');
        if (state.lineIndex < lines.length) {
          lines[state.lineIndex] = state.origLine;
          updateCode(lines.join('\n'));
        }
        setFindingLineState(prev => ({ ...prev, [findingKey]: 'original' }));
      } else {
        setFindingLineState(prev => ({ ...prev, [findingKey]: 'original' }));
      }
    } else if (lineNum) {
      const origLines = (code_snippet || '').split('\n');
      const origLine = origLines[lineNum - 1];

      if (origLine !== undefined) {
        const lines = currentCode.split('\n');
        lines[lineNum - 1] = origLine;
        const updated = lines.join('\n');
        updateCode(updated);
        setFindingLineState(prev => ({ ...prev, [findingKey]: 'original' }));
      }
    }

    if (lineNum) {
      setHighlightedLine(lineNum);
      focusLineInEditor(lineNum);
    }
  };

  // 🟢 Green: Apply fixed code cleanly (Never duplicating lines or overwriting function headers)
  const handleToggleFixedLine = (item, key) => {
    const findingKey = key || item.findingId || item.id;

    // 1. Idempotency: If this finding is ALREADY fixed, clicking it again toggles it off (reverts)
    if (findingLineState[findingKey]?.status === 'fixed' || findingLineState[findingKey] === 'fixed') {
      handleToggleMistakeLine(item, findingKey);
      return;
    }

    const lineNum = findExactLineNumberInCode(item, currentCode);
    const suggestion = item.suggestion || '';
    if (!lineNum) return;

    let replacement = '';

    // 0. Priority: Use explicit remediation_code on the finding
    if (item.remediation_code && typeof item.remediation_code === 'string') {
      replacement = item.remediation_code.trim();
    }

    // 1. Try to extract explicit code enclosed in backticks `...` or quotes '...'
    if (!replacement) {
      const codeMatch = suggestion.match(/`([^`]+)`|'([^']+)'/);
      if (codeMatch) {
        const candidate = (codeMatch[1] || codeMatch[2] || '').trim();
        if (candidate && !['const', 'auto', 'int', 'true', 'false'].includes(candidate) && candidate.length > 2) {
          replacement = candidate;
        }
      }
    }

    // 2. If suggestion is a return statement
    if (!replacement) {
      const returnMatch = suggestion.match(/(return\s+[^;.]+;?)/i);
      if (returnMatch) {
        replacement = returnMatch[1].endsWith(';') ? returnMatch[1] : returnMatch[1] + ';';
      }
    }

    // 3. If suggestion mentions pass by value: remove '&' from reference signature
    if (!replacement && (suggestion.toLowerCase().includes('value') || suggestion.toLowerCase().includes('reference'))) {
      const origText = getLineText(lineNum, currentCode);
      if (origText.includes('&')) {
        replacement = origText.replace('&', '').trim();
      }
    }

    // 4. Duplicate prevention: if code already contains this exact replacement, do NOT insert again!
    if (replacement && currentCode.includes(replacement.trim())) {
      setFindingLineState(prev => ({ 
        ...prev, 
        [findingKey]: { status: 'fixed', type: 'existing' } 
      }));
      setHighlightedLine(lineNum);
      focusLineInEditor(lineNum);
      return;
    }

    // 5. Special AppSec Integer Overflow Guard:
    // If hash map is already applied (which uses subtraction `target - nums[i]`), overflow is already fixed!
    if ((item.category === 'security' || /overflow/i.test(item.issue || '')) && 
        (currentCode.includes('unordered_map') || currentCode.includes('target - nums[i]'))) {
      setFindingLineState(prev => ({ 
        ...prev, 
        [findingKey]: { status: 'fixed', type: 'existing' } 
      }));
      setHighlightedLine(lineNum);
      focusLineInEditor(lineNum);
      return;
    }

    // 6. Multi-line Nested Loop Replacement (Performance)
    // Replace entire nested loops (with comments and inner loops) with optimal hash map
    const isLoopReplacement = (item.category === 'perf' || /loop|unordered_map|hash/i.test(suggestion)) &&
      (replacement.includes('unordered_map') || replacement.includes('hash'));

    if (isLoopReplacement) {
      // Matches everything from `// Performance Issue...` or `for (int i = 0; ...)` up to right before `return {};`
      const loopBlockRegex = /(?:\/\/[^\n]*\n\s*)?for\s*\(\s*int\s+i\s*=\s*0[\s\S]*?\n(?=\s*return\s*\{\};)/;
      
      if (loopBlockRegex.test(currentCode)) {
        const origSnippet = currentCode.match(loopBlockRegex)[0];
        const newSnippet = `    // Optimal O(n) single-pass hash map solution
    unordered_map<int, int> seen;
    for (int i = 0; i < nums.size(); i++) {
        int complement = target - nums[i];
        if (seen.count(complement)) {
            return {seen[complement], i};
        }
        seen[nums[i]] = i;
    }
`;
        const updated = formatLeetCodeIndentation(currentCode.replace(loopBlockRegex, newSnippet));
        updateCode(updated);
        setFindingLineState(prev => ({ 
          ...prev, 
          [findingKey]: { status: 'fixed', type: 'block', origSnippet, newSnippet } 
        }));
        setHighlightedLine(lineNum);
        focusLineInEditor(lineNum);
        return;
      }
    }

    // 7. General Block Replacement via target_snippet
    if (item.target_snippet && currentCode.includes(item.target_snippet.trim())) {
      const origText = item.target_snippet.trim();
      const newText = replacement.trim();
      const updated = currentCode.replace(origText, newText);
      updateCode(updated);
      setFindingLineState(prev => ({ 
        ...prev, 
        [findingKey]: { status: 'fixed', type: 'block', origSnippet: origText, newSnippet: newText } 
      }));
      setHighlightedLine(lineNum);
      focusLineInEditor(lineNum);
      return;
    }

    const lines = currentCode.split('\n');
    if (lineNum - 1 < lines.length) {
      const origLine = lines[lineNum - 1];
      const origIndent = (origLine.match(/^\s*/) || [''])[0];

      // Fix if-condition fragments: e.g. "target - nums[i] == nums[j]" -> "if (target - nums[i] == nums[j]) {"
      if (origLine.trim().startsWith('if') && origLine.trim().endsWith('{')) {
        if (!replacement.startsWith('if') && !replacement.endsWith('{')) {
          if (replacement.includes('==') || replacement.includes('!=') || replacement.includes('<') || replacement.includes('>')) {
            replacement = `if (${replacement}) {`;
          }
        }
      }

      // Guard against writing conversational English sentences into code
      const isEnglishSentence = replacement.split(' ').length > 6 && !replacement.includes('(') && !replacement.includes(';') && !replacement.includes('{');
      if (isEnglishSentence || !replacement) {
        setHighlightedLine(lineNum);
        focusLineInEditor(lineNum);
        return;
      }

      // Check whether this fix should be entered below the line instead of overwriting it
      const currentEndsWithBrace = origLine.trim().endsWith('{');
      const replacementEndsWithBrace = replacement.trim().endsWith('{');
      const isBoundaryCheckOrInsert = item.action === 'insert_below' ||
        /insert|add|below|early exit|boundary check|guard/i.test(suggestion);

      // If inserting boundary/exit condition inside a block header, enter it below with proper indentation
      const shouldInsertBelow = isBoundaryCheckOrInsert && currentEndsWithBrace && !replacementEndsWithBrace;

      if (shouldInsertBelow) {
        // Prevent duplicate insertion: check if code already contains this line anywhere
        if (currentCode.includes(replacement.trim())) {
          setFindingLineState(prev => ({ 
            ...prev, 
            [findingKey]: { status: 'fixed', type: 'existing' } 
          }));
          setHighlightedLine(lineNum);
          focusLineInEditor(lineNum);
          return;
        }

        const innerIndent = origIndent + '    ';
        const formatted = replacement.split('\n').map(l => innerIndent + l.trim()).join('\n');
        lines.splice(lineNum, 0, formatted);
        setFindingLineState(prev => ({ 
          ...prev, 
          [findingKey]: { status: 'fixed', type: 'inserted', lineIndex: lineNum, insertedText: formatted } 
        }));
      } else {
        const formatted = replacement.split('\n').map((l, i) => i === 0 ? origIndent + l.trim() : origIndent + l).join('\n');
        lines[lineNum - 1] = formatted;
        setFindingLineState(prev => ({ 
          ...prev, 
          [findingKey]: { status: 'fixed', type: 'replaced', lineIndex: lineNum - 1, origLine } 
        }));
      }

      const updated = formatLeetCodeIndentation(lines.join('\n'));
      updateCode(updated);
    }

    setHighlightedLine(lineNum);
    focusLineInEditor(lineNum);
  };

  // 1-Click: APPLY ALL FIXES AT ONCE
  const handleApplyAllFixes = () => {
    const updated = fullyRemediatedCode;
    const newStates = {};
    allFindings.forEach((item) => {
      newStates[item.findingId] = 'fixed';
    });

    updateCode(updated);
    setFindingLineState(newStates);
    setAllFixesApplied(true);
  };

  // In-Place Re-Audit Action
  const handleInPlaceReAudit = async () => {
    setIsReAuditing(true);
    try {
      if (reviewData?.is_demo || isAnyDemoSample(currentCode)) {
        // Zero-token instant re-audit for demo mode: no backend API calls or counter increments
        await new Promise((r) => setTimeout(r, 600));
        const isRemediated = allFixesApplied || currentCode.trim() === DEMO_REMEDIATED_CODE.trim();
        const baseReview = isRemediated ? DEMO_PERFECT_REVIEW : getDemoReviewForCode(currentCode);
        const newData = {
          ...baseReview,
          code_snippet: currentCode,
          created_at: new Date().toISOString()
        };
        setReviewData(newData);
        setFindingLineState({});
        setHighlightedLine(null);
        setSelectedFindingIdx(null);
        setAllFixesApplied(false);
        return;
      }

      sessionStorage.setItem('cr_raw_code', currentCode);
      sessionStorage.setItem('cr_input_mode', 'code');

      const payload = {
        raw_code: currentCode,
        language: language || 'auto',
        user_email: sessionStorage.getItem('cr_user_email') || 'guest@codereview.pro',
        problem_context: sessionStorage.getItem('cr_problem_description') || sessionStorage.getItem('cr_problem_context') || undefined
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

  const handleCopyCode = (withComments = true) => {
    const textToCopy = withComments ? currentCode : stripComments(currentCode);
    navigator.clipboard.writeText(textToCopy);
    setCopiedCodeMode(withComments ? 'comments' : 'clean');
    setTimeout(() => setCopiedCodeMode(null), 2000);
  };

  const handleCopyRemediated = (withComments = true) => {
    const textToCopy = withComments ? fullyRemediatedCode : stripComments(fullyRemediatedCode);
    navigator.clipboard.writeText(textToCopy);
    setCopiedRemediatedMode(withComments ? 'comments' : 'clean');
    setTimeout(() => setCopiedRemediatedMode(null), 2000);
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
    <div className="w-full space-y-5 animate-fadeIn font-sans">
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
            <span>{copiedPr ? 'PR Comment Copied!' : 'Copy PR Summary'}</span>
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

      {/* Degradation Warning Banner */}
      {(() => {
        const agentStatuses = reviewData?.agent_statuses || {};
        const hasDegraded = Object.values(agentStatuses).some(s => s === 'timeout' || s === 'error');
        if (!hasDegraded) return null;
        return (
          <div className="p-3.5 px-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                <strong>Partial Review Notice:</strong> One or more specialist agents encountered a timeout or error. Successful agent findings are presented below.
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[10px]">
              {Object.entries(agentStatuses).map(([name, st]) => (
                <span 
                  key={name} 
                  className={`px-2 py-0.5 rounded-md font-semibold ${
                    st === 'ok' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                    st === 'timeout' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                    st === 'error' ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-slate-500/10 text-slate-400'
                  }`}
                >
                  {name}: {st}
                </span>
              ))}
            </div>
          </div>
        );
      })()}

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
            <p className="text-[10px] text-[var(--text-muted)] mt-1 font-mono">Multi-Agent Health Score</p>
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
            <p className="text-[10px] text-[var(--text-muted)]">Logic & boundary cases</p>
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
          <span>Staff PR Review Summary</span>
        </div>
        <div className="text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-line space-y-2">
          {summary || 'Review completed successfully.'}
        </div>
      </div>

      {/* Clean Layout Switcher Bar + Width Controls */}
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

        {/* Smooth +/- 1% Width Controls */}
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
      </div>

      {/* VIEW 1: PRECISE LCS DIFF COMPARISON */}
      {layoutMode === 'diff' ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-editor)] overflow-hidden shadow-sm animate-fadeIn">
          {/* Legend Bar */}
          <div className="p-2.5 px-4 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded bg-rose-500/30 border border-rose-500"></span>
                🔴 Error / Flawed Line
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500/30 border border-emerald-500"></span>
                🟢 Corrected Line
              </span>
              <span className="flex items-center gap-1.5 text-indigo-400">
                <span className="w-2.5 h-2.5 rounded bg-indigo-500/30 border border-indigo-500"></span>
                🔵 Extra Logic Line Added
              </span>
              <span className="text-[var(--text-muted)]">
                Uncolored = Identical / Clean
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--border-subtle)]">
            {/* Column 1: Your Submission */}
            <div className="flex flex-col">
              <div className="p-3.5 px-4 bg-rose-500/10 border-b border-[var(--border-subtle)] flex items-center justify-between">
                <span className="text-xs font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  Your Submission
                </span>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">
                  {originalDiffRows.length} lines
                </span>
              </div>
              <div className="p-4 font-mono text-xs overflow-x-auto max-h-[640px] overflow-y-auto space-y-1 bg-[var(--bg-card)]">
                {originalDiffRows.map((row, i) => {
                  const isError = row.status === 'error';
                  return (
                    <div 
                      key={i} 
                      className={`leading-5 whitespace-pre flex transition-colors py-0.5 ${
                        isError ? 'bg-rose-500/20 text-rose-300 font-semibold border-l-2 border-rose-500 pl-1.5 -ml-1 rounded' : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      <span className="w-8 text-[var(--text-muted)] select-none shrink-0 text-right pr-3 font-mono text-[11px]">{row.lineNum}</span>
                      <span className="flex-1 whitespace-pre">{row.text || ' '}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Column 2: Accepted Solution */}
            <div className="flex flex-col">
              <div className="p-3 px-4 bg-emerald-500/10 border-b border-[var(--border-subtle)] flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Accepted Solution
                </span>
                
                {/* 2 LeetCode-style Copy Options */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopyRemediated(false)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all shadow-sm cursor-pointer"
                    title="Copy code without comments"
                  >
                    {copiedRemediatedMode === 'clean' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedRemediatedMode === 'clean' ? 'Copied Clean Code!' : 'Copy Code'}</span>
                  </button>

                  <button
                    onClick={() => handleCopyRemediated(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] text-[11px] font-semibold transition-all cursor-pointer"
                    title="Copy code including all comments"
                  >
                    {copiedRemediatedMode === 'comments' ? <Check className="w-3 h-3 text-emerald-500" /> : <MessageSquareQuote className="w-3 h-3" />}
                    <span>{copiedRemediatedMode === 'comments' ? 'Copied with Comments!' : 'Copy with Comments'}</span>
                  </button>
                </div>
              </div>

              <div className="p-4 font-mono text-xs overflow-x-auto max-h-[640px] overflow-y-auto space-y-1 bg-[var(--bg-card)]">
                {remediatedDiffRows.map((row, i) => {
                  let rowStyle = 'text-[var(--text-primary)]';
                  if (row.status === 'fixed') {
                    rowStyle = 'bg-emerald-500/20 text-emerald-300 font-semibold border-l-2 border-emerald-500 pl-1.5 -ml-1 rounded';
                  } else if (row.status === 'extra') {
                    rowStyle = 'bg-indigo-500/20 text-indigo-300 font-semibold border-l-2 border-indigo-500 pl-1.5 -ml-1 rounded';
                  }

                  return (
                    <div 
                      key={i} 
                      className={`leading-5 whitespace-pre flex transition-colors py-0.5 ${rowStyle}`}
                    >
                      <span className="w-8 text-[var(--text-muted)] select-none shrink-0 text-right pr-3 font-mono text-[11px]">{row.lineNum}</span>
                      <span className="flex-1 font-medium whitespace-pre">{row.text || ' '}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW 2: SIDE-BY-SIDE REVIEW */
        <div className="flex flex-col lg:flex-row gap-5 items-start transition-all duration-300">
          {/* Left: Source Code Inspector */}
          <div 
            style={{ width: `${inspectorWidthPercent}%` }} 
            className="w-full space-y-3 transition-all duration-150"
          >
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span className="font-bold text-[var(--text-primary)] uppercase text-[11px] flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-blue-600" />
                Source Code Inspector
              </span>

              {/* 2 Copy Options: Copy Code vs Copy with Comments */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleCopyCode(false)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] text-[10px] font-bold text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
                  title="Copy clean code without comments"
                >
                  {copiedCodeMode === 'clean' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCodeMode === 'clean' ? 'Copied!' : 'Copy Code'}</span>
                </button>

                <button
                  onClick={() => handleCopyCode(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] text-[10px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
                  title="Copy code with comments"
                >
                  {copiedCodeMode === 'comments' ? <Check className="w-3 h-3 text-emerald-500" /> : <MessageSquareQuote className="w-3 h-3" />}
                  <span>{copiedCodeMode === 'comments' ? 'Copied!' : 'With Comments'}</span>
                </button>
              </div>
            </div>

            {/* Code Box with Horizontal Scroll and Synchronized Gutter */}
            <div className={`rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-editor)] overflow-hidden flex flex-col shadow-inner ${editorHeightClass} transition-all duration-300`}>
              <div className="flex font-mono text-xs flex-1 overflow-hidden">
                {/* Line Gutter */}
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

                {/* Textarea with Whitespace Pre (Single-line comments without wrapping) */}
                <textarea
                  ref={editorTextareaRef}
                  value={currentCode}
                  wrap="off"
                  onScroll={(e) => {
                    if (gutterRef.current) {
                      gutterRef.current.scrollTop = e.target.scrollTop;
                    }
                  }}
                  onChange={(e) => {
                    updateCode(e.target.value);
                  }}
                  className="flex-1 p-3.5 bg-transparent text-[var(--text-primary)] font-mono text-xs leading-5 focus:outline-none resize-none overflow-x-auto overflow-y-auto whitespace-pre selection:bg-blue-500/30 selection:text-white"
                  placeholder="// Source code here..."
                />
              </div>

              {/* Status bar */}
              <div className="p-2.5 px-4 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono">
                <span>{codeLines.length} lines</span>
                <span className="text-blue-600 font-bold uppercase">{language}</span>
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
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'security' ? 'bg-rose-600 text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span>AppSec ({security.length})</span>
                  {reviewData?.agent_statuses?.security && reviewData.agent_statuses.security !== 'ok' && (
                    <span className="text-[9px] px-1 py-0.2 rounded font-mono font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                      {reviewData.agent_statuses.security}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('bug')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'bug' ? 'bg-amber-600 text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span>Bugs ({bugs.length})</span>
                  {reviewData?.agent_statuses?.bugs && reviewData.agent_statuses.bugs !== 'ok' && (
                    <span className="text-[9px] px-1 py-0.2 rounded font-mono font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                      {reviewData.agent_statuses.bugs}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('perf')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'perf' ? 'bg-emerald-600 text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span>Perf ({performance.length})</span>
                  {reviewData?.agent_statuses?.performance && reviewData.agent_statuses.performance !== 'ok' && (
                    <span className="text-[9px] px-1 py-0.2 rounded font-mono font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                      {reviewData.agent_statuses.performance}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('style')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'style' ? 'bg-purple-600 text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span>Style ({style.length})</span>
                  {reviewData?.agent_statuses?.style && reviewData.agent_statuses.style !== 'ok' && (
                    <span className="text-[9px] px-1 py-0.2 rounded font-mono font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                      {reviewData.agent_statuses.style}
                    </span>
                  )}
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
                  const origLineMatch = String(item.line || '').match(/\d+/);
                  const origLineNum = origLineMatch ? parseInt(origLineMatch[0], 10) : 1;
                  const findingKey = item.findingId || item.id || `f_${idx}`;
                  const isLineFixed = findingLineState[findingKey] === 'fixed' || findingLineState[findingKey]?.status === 'fixed';
                  const originalLineText = (item.detected_line && item.detected_line.trim())
                    ? item.detected_line.trim()
                    : (getLineText(origLineNum, code_snippet) || getLineText(origLineNum, currentCode));

                  return (
                    <div 
                      key={findingKey} 
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
                            Line {origLineNum}
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

                      {/* Interactive Mistake (Red) vs Suggested Fix (Green) Blocks */}
                      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-editor)] text-xs font-mono overflow-hidden space-y-0">
                        {/* 🔴 RED: Click to view/restore user's original mistake line */}
                        {originalLineText && (
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleMistakeLine(item, findingKey);
                            }}
                            className="p-2.5 px-3 border-b border-[var(--border-subtle)] bg-rose-500/10 hover:bg-rose-500/20 transition-colors cursor-pointer"
                            title="Click to view & select your original line in editor"
                          >
                            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block mb-1">
                              🔴 Mistake / Detected Line (Line {origLineNum}) • Click to Focus
                            </span>
                            <div className="text-[11px] text-rose-400 font-mono whitespace-pre truncate">
                              {originalLineText}
                            </div>
                          </div>
                        )}

                        {/* 🟢 GREEN: Click to apply/update line directly in the editor */}
                        {item.suggestion && (
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFixedLine(item, findingKey);
                            }}
                            className="p-2.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                            title="Click to apply clean fix into your code editor"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span>🟢 Optimization Recommendation • Click to Apply Fix</span>
                              </span>
                              {isLineFixed && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                                  Fixed ✓
                                </span>
                              )}
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

      {/* Bottom Bar: Clean LeetCode-style Action Buttons */}
      <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-wrap items-center justify-end gap-3 shadow-md">
        <button
          onClick={handleApplyAllFixes}
          className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
            allFixesApplied 
              ? 'bg-emerald-600 text-white shadow-emerald-500/20' 
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {allFixesApplied ? <CheckCheck className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          <span>{allFixesApplied ? 'All Fixes Applied!' : `Apply Fixes (${allFindings.length}) ✨`}</span>
        </button>

        <button
          onClick={handleInPlaceReAudit}
          disabled={isReAuditing}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
        >
          {isReAuditing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          <span>{isReAuditing ? 'Running Analysis...' : 'Run Review ⚡'}</span>
        </button>
      </div>
    </div>
  );
}
