import React from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application Error Caught by Boundary:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('clerk-db-jwt');
    } catch (e) {}
    window.location.hash = '';
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const errorText = this.state.error ? (this.state.error.message || String(this.state.error)) : 'Unknown runtime exception';

      return (
        <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-[#18181b] border border-white/10 rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-2xl animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-lg">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Something went wrong</h2>
              <p className="text-xs text-white/60 leading-relaxed font-mono bg-black/40 p-3 rounded-xl border border-white/5 break-words">
                {errorText}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
