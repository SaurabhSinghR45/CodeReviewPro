import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Briefcase, 
  Award, 
  Activity, 
  CheckCircle2, 
  LogOut, 
  Save, 
  ShieldCheck, 
  Building, 
  Key 
} from 'lucide-react';

const GithubIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export default function ProfileModal({ isOpen, onClose, user, onUpdateUser, onLogout }) {
  const [name, setName] = useState(user?.name || 'Saurabh Singh');
  const [email, setEmail] = useState(user?.email || 'samratsaurabh2003@gmail.com');
  const [role, setRole] = useState(user?.role || 'Lead Architect');
  const [githubUser, setGithubUser] = useState(user?.githubUser || 'SaurabhSinghR45');
  const [workspace, setWorkspace] = useState(user?.workspace || 'SAURABH SINGH');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    const updated = {
      ...user,
      name,
      email,
      role,
      githubUser,
      workspace,
      avatarInitials: (name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'SS').slice(0, 2)
    };
    localStorage.setItem('cr_user', JSON.stringify(updated));
    onUpdateUser(updated);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="relative w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl shadow-2xl overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="p-6 pb-4 flex items-center justify-between border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-blue-500/20">
              {user?.avatarInitials || 'SS'}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[var(--text-primary)]">
                {user?.name || 'Saurabh Singh'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5 font-mono">
                <span>{user?.role || 'Lead Architect'}</span>
                <span>•</span>
                <span className="text-blue-600">{user?.workspace || '1 workspace'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl theme-card text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Quick Metrics Badge Row (Syncra Style) */}
          <div className="grid grid-cols-3 gap-3">
            <div className="stat-card-blue p-3 rounded-xl text-center space-y-0.5">
              <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">Total Audits</span>
              <div className="text-base font-extrabold text-[var(--text-primary)]">12</div>
            </div>

            <div className="stat-card-green p-3 rounded-xl text-center space-y-0.5">
              <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">Health Avg</span>
              <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">92%</div>
            </div>

            <div className="stat-card-purple p-3 rounded-xl text-center space-y-0.5">
              <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">Security CVEs</span>
              <div className="text-base font-extrabold text-purple-600 dark:text-purple-400">0 Critical</div>
            </div>
          </div>

          {/* Edit Profile Form */}
          <form onSubmit={handleSave} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[var(--text-secondary)]">Full Name</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--text-secondary)]">Role Title</label>
                <div className="relative">
                  <Briefcase className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-3" />
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[var(--text-secondary)]">Email Address</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--text-secondary)]">Connected GitHub</label>
                <div className="relative">
                  <GithubIcon className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-3" />
                  <input
                    type="text"
                    value={githubUser}
                    onChange={(e) => setGithubUser(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[var(--text-secondary)]">Active Workspace Name</label>
              <div className="relative">
                <Building className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-3" />
                <input
                  type="text"
                  value={workspace}
                  onChange={(e) => setWorkspace(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-500/10 text-xs font-bold transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl theme-card text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  {saved ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{saved ? 'Saved!' : 'Save Profile'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
