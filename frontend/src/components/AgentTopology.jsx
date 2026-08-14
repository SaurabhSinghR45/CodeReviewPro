import React from 'react';
import { Palette, Bug, ShieldAlert, Zap, Cpu, Sparkles, Layers } from 'lucide-react';

export default function AgentTopology({ isAuditing = false }) {
  const agents = [
    { id: 'style', name: 'Style & Syntax', role: 'Clean Code', icon: Palette, color: 'text-purple-400', border: 'border-purple-500/20', bg: 'bg-purple-500/5' },
    { id: 'bug', name: 'Logic & Bugs', role: 'Runtime Safety', icon: Bug, color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/5' },
    { id: 'security', name: 'AppSec & CWEs', role: 'OWASP Top 10', icon: ShieldAlert, color: 'text-rose-400', border: 'border-rose-500/20', bg: 'bg-rose-500/5' },
    { id: 'perf', name: 'O(n) Performance', role: 'Complexity & Big-O', icon: Zap, color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5' },
  ];

  return (
    <div className="theme-panel rounded-2xl p-4 sm:p-5 border transition-all">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-3 text-xs">
        <span className="font-semibold flex items-center gap-2 text-[var(--text-primary)]">
          <Layers className="w-4 h-4 text-indigo-500" />
          Autonomous Multi-Agent Review Pipeline
        </span>
        <span className="font-mono text-[10px] text-[var(--text-muted)] flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isAuditing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></span>
          {isAuditing ? 'Auditing Codebase...' : 'Pipeline Ready (4 Agents)'}
        </span>
      </div>

      {/* Topology Pipeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs">
        {/* Node 1: Ingestion */}
        <div className="md:col-span-3 theme-card p-3.5 rounded-xl border flex flex-col justify-center">
          <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] font-semibold">1. Input Context</span>
          <div className="font-semibold text-[var(--text-primary)] mt-1 truncate">
            GitHub Repo / AST
          </div>
          <span className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">Multi-File Extraction</span>
        </div>

        {/* Node 2: 4 Parallel Pods */}
        <div className="md:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {agents.map((agent) => {
            const Icon = agent.icon;
            return (
              <div 
                key={agent.id}
                className={`p-2.5 rounded-xl border ${agent.border} ${agent.bg} flex flex-col items-center text-center justify-center transition-all ${
                  isAuditing ? 'animate-pulse' : ''
                }`}
              >
                <Icon className={`w-4 h-4 ${agent.color} mb-1`} />
                <span className="font-semibold text-[11px] text-[var(--text-primary)] leading-tight">{agent.name}</span>
                <span className="text-[9px] font-mono text-[var(--text-muted)] mt-0.5">{agent.role}</span>
              </div>
            );
          })}
        </div>

        {/* Node 3: Synthesis & Health Output */}
        <div className="md:col-span-3 theme-card p-3.5 rounded-xl border flex flex-col justify-center">
          <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] font-semibold">3. Synthesis</span>
          <div className="font-semibold text-indigo-400 mt-1 flex items-center gap-1.5 truncate">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Health Score (0-100)</span>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">Staff PR Summary</span>
        </div>
      </div>
    </div>
  );
}
