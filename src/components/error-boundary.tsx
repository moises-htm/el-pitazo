"use client";

import React, { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Generic error boundary.
 * Use `fallback` to supply a custom UI.  Falls back to a neutral message by default.
 *
 * Usage:
 *   <ErrorBoundary fallback={<p>Map unavailable</p>}>
 *     <GoogleMap ... />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          style={{
            padding: "1rem",
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
            background: "#f9fafb",
            color: "#6b7280",
            textAlign: "center",
          }}
        >
          <p style={{ margin: 0, fontWeight: 500 }}>
            Este componente no está disponible en este momento.
          </p>
          {process.env.NODE_ENV !== "production" && this.state.error && (
            <pre
              style={{
                marginTop: "0.5rem",
                fontSize: "0.75rem",
                textAlign: "left",
                whiteSpace: "pre-wrap",
              }}
            >
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Convenience wrapper with a Google Maps-specific fallback.
 */
export function MapErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div
          style={{
            width: "100%",
            height: "100%",
            minHeight: 200,
            background: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "0.5rem",
            color: "#9ca3af",
          }}
        >
          <span>Mapa no disponible</span>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
