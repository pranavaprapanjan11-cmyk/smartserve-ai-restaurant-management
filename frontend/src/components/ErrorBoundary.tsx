import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAF9] p-6 text-[#111827]">
          <div className="w-full max-w-lg rounded-xl border border-[#D1D5DB] bg-white p-8 shadow-lg text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 text-2xl font-bold">
              ⚠️
            </div>
            <h1 className="text-xl font-extrabold text-[#111827]">SmartServe AI - Application Error</h1>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              An unhandled UI error occurred. Click reload to refresh the page or return home.
            </p>
            {this.state.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-left overflow-x-auto text-[11px] font-mono text-red-800">
                {this.state.error.toString()}
              </div>
            )}
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-lg bg-[#0F6B4B] text-white text-xs font-bold hover:bg-[#084C37] transition shadow-sm"
              >
                Reload Application
              </button>
              <button
                type="button"
                onClick={() => {
                  window.localStorage.clear();
                  window.location.href = '/auth/login';
                }}
                className="px-5 py-2.5 rounded-lg bg-white border border-[#D1D5DB] text-[#111827] text-xs font-bold hover:bg-gray-50 transition"
              >
                Reset & Relogin
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
