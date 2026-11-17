import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('AppLayout ErrorBoundary caught an error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
          <div className="p-6 bg-navy-900 border border-slate-800 rounded-2xl shadow-xl text-white">
            <h2 className="text-lg font-bold text-rose-400 mb-2">Component Render Notice</h2>
            <p className="text-sm text-slate-300 mb-4">{this.state.error?.message || 'An unexpected error occurred while rendering this section.'}</p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Reload Workspace
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="h-screen bg-surface-100 flex flex-col font-sans overflow-hidden">
      {/* Top Header - Fixed 64px height */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Fixed Left Navigation Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Scrollable Center Workstation Area */}
        <main className="flex-1 lg:pl-64 flex flex-col min-w-0 overflow-y-auto">
          <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <AppErrorBoundary>
              <Outlet />
            </AppErrorBoundary>
          </div>

          {/* Standard SaaS Footer */}
          <footer className="px-6 py-4 border-t border-slate-200/80 bg-white/60 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 flex-shrink-0">
            <div>
              <span className="font-semibold text-slate-700">FoodDesk</span> — Manage Smart. Serve Fast.
            </div>
            <div className="text-slate-400">
              Walk-in Multi-Stall POS & Financial Management System
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
