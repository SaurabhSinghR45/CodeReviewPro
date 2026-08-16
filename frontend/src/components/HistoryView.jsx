import React, { useState, useEffect } from 'react';
import { History, Search, Calendar, ArrowRight, Loader2, AlertCircle, FileCode, RefreshCw, Activity, Award } from 'lucide-react';

const GithubIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export default function HistoryView({ onSelectReview, user, onOpenAuth }) {
  const isGuest = !user || user.name === 'Guest Developer' || !user.isVerified;
  const [reviews, setReviews] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(!isGuest);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedLoadingId, setSelectedLoadingId] = useState(null);

  const fetchHistory = async () => {
    if (isGuest) {
      setReviews([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const userEmail = user?.email || '';
      const res = await fetch(`/reviews?user_email=${encodeURIComponent(userEmail)}`);
      if (!res.ok) throw new Error('Failed to load review history');
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorMsg(err.message || 'Unable to connect to database history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user?.email, isGuest]);

  const handleSelect = async (id) => {
    setSelectedLoadingId(id);
    try {
      const res = await fetch(`/reviews/${id}`);
      if (!res.ok) throw new Error(`Failed to fetch review #${id}`);
      const data = await res.json();
      onSelectReview(data);
    } catch (err) {
      alert(err.message || 'Error opening review detail.');
    } finally {
      setSelectedLoadingId(null);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    const query = searchQuery.toLowerCase();
    return (
      (r.source_url && r.source_url.toLowerCase().includes(query)) ||
      (r.summary && r.summary.toLowerCase().includes(query)) ||
      (r.language && r.language.toLowerCase().includes(query)) ||
      r.id.toString().includes(query)
    );
  });

  const avgHealthScore = reviews.length > 0
    ? Math.round(reviews.reduce((acc, curr) => acc + (curr.health_score || 100), 0) / reviews.length)
    : 100;

  const formatDate = (isoString) => {
    if (!isoString) return 'Recent';
    try {
      return new Date(isoString).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-[var(--border-subtle)]">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-500" />
            SaaS Review History & Audit Log
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Browse and inspect all past code reviews, security audits, and health score ratings.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl theme-panel text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Overview Analytics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="theme-panel p-4 rounded-2xl space-y-1">
          <div className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Total Audits</span>
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-[var(--text-primary)]">{reviews.length}</div>
          <p className="text-[10px] text-[var(--text-muted)]">Stored in database</p>
        </div>

        <div className="theme-panel p-4 rounded-2xl space-y-1">
          <div className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Avg Code Health</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-[var(--text-primary)]">{avgHealthScore} / 100</div>
          <p className="text-[10px] text-[var(--text-muted)]">Across all audits</p>
        </div>

        <div className="theme-panel p-4 rounded-2xl space-y-1">
          <div className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Supported Languages</span>
            <FileCode className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-extrabold text-[var(--text-primary)]">Polyglot</div>
          <p className="text-[10px] text-[var(--text-muted)]">Python, JS, TS, Go, Rust, C++</p>
        </div>
      </div>

      {/* Search Filter Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by GitHub URL, summary keywords, language, or Review ID..."
          className="w-full pl-10 pr-4 py-2.5 theme-panel rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] text-xs focus:outline-none focus:border-indigo-500 transition-all"
        />
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Review List */}
      {isLoading ? (
        <div className="text-center py-16 space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
          <p className="text-xs text-[var(--text-secondary)] font-medium">Fetching history log from SQLite database...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="theme-panel p-12 text-center rounded-2xl space-y-3">
          <FileCode className="w-10 h-10 text-[var(--text-muted)] mx-auto" />
          <h3 className="text-base font-bold text-[var(--text-primary)]">No Past Reviews Found</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            {searchQuery ? 'No reviews matched your search query.' : 'Submit code on the workbench to create your first review!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReviews.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className="theme-card p-4 sm:p-5 rounded-2xl hover:border-indigo-500/40 transition-all cursor-pointer group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                    Audit #{item.id}
                  </span>

                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                    (item.health_score || 100) >= 88 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                    (item.health_score || 100) >= 68 ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                  }`}>
                    Score: {item.health_score || 100} ({item.health_grade || 'A'})
                  </span>

                  {item.language && item.language !== 'auto' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold theme-panel text-[var(--text-secondary)] uppercase">
                      {item.language}
                    </span>
                  )}
                  
                  <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1 font-mono truncate max-w-md">
                    {item.source_url?.startsWith('http') ? (
                      <>
                        <GithubIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        {item.source_url}
                      </>
                    ) : (
                      <>
                        <FileCode className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        Pasted / Uploaded Code
                      </>
                    )}
                  </span>
                </div>

                <p className="text-xs text-[var(--text-primary)] line-clamp-2 leading-relaxed">
                  {item.summary || 'Review completed.'}
                </p>

                <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                  <Calendar className="w-3 h-3 text-[var(--text-muted)]" />
                  <span>{formatDate(item.created_at)}</span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2 text-indigo-500 group-hover:text-indigo-400 font-semibold text-xs pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border-subtle)] w-full sm:w-auto justify-end">
                {selectedLoadingId === item.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <span>Inspect Full Report</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
