"use client";

import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-950 p-6 text-center text-slate-100">
          <h2 className="text-lg font-bold text-red-400">Something went wrong</h2>
          <p className="mt-2 max-w-md text-sm text-slate-300">
            Please reload the screen to return to the Shop-Floor Supervisor Copilot.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 min-h-[44px] rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950"
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

