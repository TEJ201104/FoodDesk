import React from 'react';
import { AlertCircle, RefreshCw, LogOut } from 'lucide-react';
import { storageService } from '../../services/storageService.js';

export class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('FoodDesk RootErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleResetAndLogin = () => {
    try {
      storageService.clearSession();
    } catch (e) {}
    this.setState({ hasError: false, error: null });
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-6 text-white font-sans">
          <div className="max-w-md w-full bg-navy-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-elevated text-center space-y-4">
            <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Application Workspace Notice</h2>
              <p className="text-xs text-slate-400 mt-1">
                FoodDesk caught an unexpected client error. Your business records in storage remain safe.
              </p>
            </div>
            <div className="p-3 bg-navy-950 rounded-lg border border-slate-800 text-left font-mono text-[11px] text-rose-300 break-words max-h-32 overflow-y-auto">
              {this.state.error?.message || 'Unknown runtime error'}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>
              <button
                onClick={this.handleResetAndLogin}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-navy-800 hover:bg-navy-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Reset to Login</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

