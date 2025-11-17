/**
 * Error Boundary Component
 *
 * PERF-002: Handles errors in lazy-loaded chunks and other React errors
 * Phase 3: Production Hardening & Optimization
 *
 * Catches errors during rendering, including chunk load failures when
 * using React.lazy() for code splitting.
 */

import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
  isChunkError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isChunkError: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if it's a chunk loading error
    const isChunkError =
      error.name === "ChunkLoadError" ||
      error.message.includes("Failed to fetch dynamically imported module") ||
      error.message.includes("Importing a module script failed") ||
      error.message.includes("ChunkLoadError") ||
      error.message.includes("Loading chunk") ||
      error.message.includes("dynamically imported module");

    return {
      hasError: true,
      error,
      isChunkError,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details to console
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState({
      errorInfo: errorInfo.componentStack || null,
    });

    // In production, you might want to log to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleReload = () => {
    // For chunk errors, reload the page to fetch fresh chunks
    window.location.reload();
  };

  handleReset = () => {
    // Reset error state and try rendering again
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isChunkError: false,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, isChunkError } = this.state;

      // Chunk load error (common with code splitting)
      if (isChunkError) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
            <div className="max-w-md w-full bg-card border rounded-lg shadow-lg p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-foreground mb-2">
                    Update Required
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    A new version of the application is available. Please reload the page to
                    continue.
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={this.handleReload} className="flex-1">
                      Reload Page
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // General React error
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
          <div className="max-w-md w-full bg-card border rounded-lg shadow-lg p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  Something went wrong
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  An unexpected error occurred. Please try again or reload the page.
                </p>

                {/* Show error details in development */}
                {process.env.NODE_ENV === "development" && error && (
                  <details className="mb-4">
                    <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                      Error details
                    </summary>
                    <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                      {error.toString()}
                    </pre>
                  </details>
                )}

                <div className="flex gap-2">
                  <Button onClick={this.handleReset} variant="outline" className="flex-1">
                    Try Again
                  </Button>
                  <Button onClick={this.handleReload} className="flex-1">
                    Reload Page
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
