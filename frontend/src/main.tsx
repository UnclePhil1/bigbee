// Polyfills for Node.js modules in browser
import { Buffer } from 'buffer';

console.log("🚀 Main.tsx starting...");

if (typeof window !== 'undefined') {
  (window as any).global = window;
  (window as any).process = { env: {} };
  (window as any).Buffer = Buffer;
  console.log("✅ Polyfills set up");
}

import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { SolanaWalletProvider } from "@/components/solana-wallet-provider";

console.log("✅ Imports completed");

// Error Boundary component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
    console.log("✅ ErrorBoundary constructed");
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error("❌ ErrorBoundary caught error:", error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Root Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-8">
          <h1 className="text-2xl mb-4">Something went wrong!</h1>
          <p className="text-red-400 mb-4">{this.state.error?.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

console.log("🚀 About to render app...");

const rootElement = document.getElementById("root");
console.log("🔍 Root element found:", !!rootElement);

if (!rootElement) {
  console.error("❌ Root element not found!");
} else {
  try {
    const root = createRoot(rootElement);
    console.log("✅ React root created");
    
    root.render(
      <ErrorBoundary>
        <SolanaWalletProvider>
          <StrictMode>
            <App />
          </StrictMode>
        </SolanaWalletProvider>
      </ErrorBoundary>
    );
    console.log("✅ App rendered successfully");
  } catch (error) {
    console.error("❌ Failed to render app:", error);
  }
}
