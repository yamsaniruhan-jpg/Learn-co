import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 my-4 rounded-3xl bg-[#FFFFFF] dark:bg-[#2A2647] border-2 border-[#F25F5C] text-[#2D2A4A] dark:text-[#F1EFFF] shadow-[0_4px_16px_rgba(242,95,92,0.12)] animate-in fade-in duration-200">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-[#F25F5C] text-white shrink-0 shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-black text-[#2D2A4A] dark:text-[#F1EFFF] font-display">
                {this.props.fallbackTitle || 'Component Rendering Recovered'}
              </h3>
              <p className="text-xs text-[#6B6890] dark:text-[#B4B0D5] mt-1 leading-relaxed font-medium">
                {this.props.fallbackMessage ||
                  'An unexpected issue occurred while rendering this module. You can reload this component without losing your global progress.'}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  onClick={this.handleReset}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reload Component</span>
                </button>

                <button
                  onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                >
                  <span>{this.state.showDetails ? 'Hide Error Details' : 'View Error Details'}</span>
                  {this.state.showDetails ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {this.state.showDetails && this.state.error && (
                <div className="mt-4 p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800">
                  <div className="font-bold text-rose-400">{this.state.error.toString()}</div>
                  {this.state.errorInfo?.componentStack && (
                    <pre className="mt-2 text-slate-400 text-[10px] whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
