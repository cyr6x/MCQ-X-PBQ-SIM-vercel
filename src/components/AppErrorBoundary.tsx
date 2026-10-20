import { Component, type ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches render failures in any routed screen so one broken module cannot
 * blank the whole trainer. Saved training data lives in localStorage outside
 * React, so a caught error never destroys attempt history or resume state.
 */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
        <div className="h-12 w-12 rounded-full bg-destructive/10 p-3 text-2xl text-destructive" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 9v4m0 4h.01" strokeLinecap="round" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        </div>
        <h1 className="text-lg font-bold">This screen failed to load</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          An unexpected error occurred here. Your attempt history, resume state and settings are stored outside this screen and are safe.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => { this.setState({ error: null }); }}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Try again
          </button>
          <button
            onClick={() => { window.location.hash = '#/'; this.setState({ error: null }); }}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Go home
          </button>
        </div>
      </div>
    );
  }
}
