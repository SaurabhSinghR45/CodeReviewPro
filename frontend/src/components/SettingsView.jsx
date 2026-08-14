import React, { useState } from 'react';
import { Sliders, ShieldCheck, CheckCircle2, Save, Cpu } from 'lucide-react';

export default function SettingsView() {
  const [model, setModel] = useState('auto-fast');
  const [strictness, setStrictness] = useState('standard');
  const [cweRules, setCweRules] = useState({
    sqlInjection: true,
    hardcodedSecrets: true,
    insecureDeserialization: true,
    pathTraversal: true,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-[var(--border-subtle)]">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-500" />
            Engine Rules & Multi-Agent Configuration
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Configure agent audit thresholds, security rule matrices, and reasoning inference settings.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer"
        >
          {saved ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          {saved ? 'Settings Saved' : 'Save Configuration'}
        </button>
      </div>

      {/* Model & Runtime Settings */}
      <div className="theme-panel p-5 rounded-2xl space-y-4">
        <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-500" />
          Core Engine & Inference Parameters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-[var(--text-secondary)] font-semibold block">Inference Engine Mode</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full p-2.5 theme-card rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 font-sans text-xs"
            >
              <option value="auto-fast">High-Speed Parallel Engine (Default)</option>
              <option value="deep-audit">Deep Architectural Reasoning Mode</option>
              <option value="appsec-strict">AppSec Zero-Tolerance Security Mode</option>
            </select>
            <p className="text-[10px] text-[var(--text-muted)] font-mono">Configured via backend/.env API keys</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[var(--text-secondary)] font-semibold block">Audit Sensitivity Threshold</label>
            <select
              value={strictness}
              onChange={(e) => setStrictness(e.target.value)}
              className="w-full p-2.5 theme-card rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 font-sans text-xs"
            >
              <option value="standard">Standard (Balanced Review)</option>
              <option value="strict">Strict (Zero Tolerance, Deep Audit)</option>
              <option value="lenient">Lenient (Focus on Critical Bugs Only)</option>
            </select>
            <p className="text-[10px] text-[var(--text-muted)] font-mono">Adjusts severity penalty weights on Health Score</p>
          </div>
        </div>
      </div>

      {/* Security Rule Matrix */}
      <div className="theme-panel p-5 rounded-2xl space-y-4">
        <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-rose-500" />
          Active AppSec & Vulnerability Audit Rules
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <label className="p-3 rounded-xl theme-card flex items-center justify-between cursor-pointer">
            <div>
              <span className="font-semibold text-[var(--text-primary)] block">SQL Injection (CWE-89)</span>
              <span className="text-[10px] text-[var(--text-muted)]">Flags raw queries, unescaped string formatting</span>
            </div>
            <input
              type="checkbox"
              checked={cweRules.sqlInjection}
              onChange={(e) => setCweRules({...cweRules, sqlInjection: e.target.checked})}
              className="rounded text-indigo-600 focus:ring-0"
            />
          </label>

          <label className="p-3 rounded-xl theme-card flex items-center justify-between cursor-pointer">
            <div>
              <span className="font-semibold text-[var(--text-primary)] block">Hardcoded Secrets (CWE-798)</span>
              <span className="text-[10px] text-[var(--text-muted)]">Detects API keys, private tokens, passwords</span>
            </div>
            <input
              type="checkbox"
              checked={cweRules.hardcodedSecrets}
              onChange={(e) => setCweRules({...cweRules, hardcodedSecrets: e.target.checked})}
              className="rounded text-indigo-600 focus:ring-0"
            />
          </label>

          <label className="p-3 rounded-xl theme-card flex items-center justify-between cursor-pointer">
            <div>
              <span className="font-semibold text-[var(--text-primary)] block">Unsafe Deserialization (CWE-502)</span>
              <span className="text-[10px] text-[var(--text-muted)]">Flags pickle.loads, eval, exec executions</span>
            </div>
            <input
              type="checkbox"
              checked={cweRules.insecureDeserialization}
              onChange={(e) => setCweRules({...cweRules, insecureDeserialization: e.target.checked})}
              className="rounded text-indigo-600 focus:ring-0"
            />
          </label>

          <label className="p-3 rounded-xl theme-card flex items-center justify-between cursor-pointer">
            <div>
              <span className="font-semibold text-[var(--text-primary)] block">Path Traversal (CWE-22)</span>
              <span className="text-[10px] text-[var(--text-muted)]">Checks file open paths against user input</span>
            </div>
            <input
              type="checkbox"
              checked={cweRules.pathTraversal}
              onChange={(e) => setCweRules({...cweRules, pathTraversal: e.target.checked})}
              className="rounded text-indigo-600 focus:ring-0"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
