"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import * as Sentry from "@sentry/nextjs";

import { Button } from "@/components/ui/button";
import { logEvent } from "@/lib/analytics";

type ErrorBoundaryProps = {
  children: ReactNode;
  onReset?: () => void;
  fallback?: (error: Error, reset: () => void) => ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[error-boundary]", { error, info });
    logEvent({
      event: "error",
      metadata: {
        source: "react_error_boundary",
        message: error.message,
      },
    });
    Sentry.captureException(error, {
      tags: {
        boundary: "client",
      },
      extra: {
        componentStack: info.componentStack,
      },
    });
  }

  private reset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-2xl border border-red/30 bg-white/85 p-6 text-center shadow-[0_24px_60px_-28px_rgba(192,57,43,0.45)]">
          <div className="space-y-2">
            <p className="font-display text-2xl uppercase tracking-[0.3em] text-red">Majnu fainted.</p>
            <p className="text-sm text-foreground/70">Try again.</p>
          </div>
          <Button onClick={this.reset} variant="secondary">
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
