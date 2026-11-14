"use client";

import React, { Component, ErrorInfo, useEffect } from "react";

const EXTENSION_ERROR_PATTERNS = [
  "Could not establish connection. Receiving end does not exist.",
  "The message port closed before a response was received.",
  "Extension context invalidated.",
  "Failed to connect to MetaMask",
  "User closed the window before completing the action",
  "Wallet request timed out",
  "chrome-extension://",
  "moz-extension://",
];

function isExtensionNoise(msg: string): boolean {
  return EXTENSION_ERROR_PATTERNS.some((pattern) => msg.includes(pattern));
}

export function ExtensionErrorGuard({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Suppress extension errors in unhandledrejection
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reasonMsg =
        event.reason?.message ||
        event.reason?.stack ||
        String(event.reason || "");

      if (isExtensionNoise(reasonMsg)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        console.warn("[Pandem Guard] Suppressed browser extension background noise:", reasonMsg);
      }
    };

    // Suppress extension errors in window.onerror
    const handleError = (event: ErrorEvent) => {
      const errorMsg =
        event.message ||
        event.error?.message ||
        event.filename ||
        String(event.error || "");

      if (isExtensionNoise(errorMsg)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        console.warn("[Pandem Guard] Suppressed browser extension runtime error:", errorMsg);
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection, true);
    window.addEventListener("error", handleError, true);

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection, true);
      window.removeEventListener("error", handleError, true);
    };
  }, []);

  return <ErrorBoundary>{children}</ErrorBoundary>;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const msg = error?.message || String(error);
    // If it's extension noise, don't trigger error boundary
    if (isExtensionNoise(msg)) {
      return { hasError: false, errorMessage: "" };
    }
    return { hasError: true, errorMessage: msg };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const msg = error?.message || String(error);
    if (!isExtensionNoise(msg)) {
      console.warn("[Pandem UI Error]:", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 m-4 rounded-none bg-[#171717] border border-[#2E2E2E] text-center space-y-4">
          <div className="text-[#894DEF] font-mono text-sm font-bold">
            Notice: Component encountered an unexpected state
          </div>
          <p className="text-xs text-[#B8B8B8] max-w-md mx-auto font-mono">
            {this.state.errorMessage}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, errorMessage: "" })}
            className="px-4 py-2 rounded-none bg-[#894DEF] hover:bg-[#A273F2] text-[#FAFAFA] border border-[#FAFAFA] font-semibold text-xs font-mono transition-colors"
          >
            Reset & Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
