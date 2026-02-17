import React, { Component, type ReactNode } from "react";

interface Props {
  name: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-card">
            <h2>Failed to load {this.props.name}</h2>
            <p>
              The <strong>{this.props.name}</strong> micro-frontend is
              unavailable. This demonstrates <em>failure isolation</em> — the
              rest of the app keeps working.
            </p>
            <p className="text-sm text-muted" style={{ marginBottom: "var(--space-md)" }}>
              {this.state.error?.message}
            </p>
            <button
              className="btn btn-primary"
              onClick={() => this.setState({ hasError: false })}
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
