import React, { Component, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-8 h-screen w-full max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-4 font-display">Something went wrong</h1>
          <p className="text-lg text-medium-text mb-8">The dream weave encountered an unexpected tangle.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-dreamy-purple to-dreamy-indigo hover:opacity-90 text-white font-bold py-4 px-8 rounded-full transition-all"
          >
            <RefreshCw size={20} />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
