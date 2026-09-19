import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
          <div className="bg-slate-900 border border-red-500/50 rounded-2xl p-8 max-w-2xl w-full text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Something went wrong.</h1>
            <p className="text-muted-foreground mb-6">An unexpected error occurred in the application.</p>
            <pre className="text-left bg-slate-950 p-4 rounded-xl overflow-x-auto text-sm text-red-300 border border-red-900/50 mb-6">
              {this.state.error?.toString()}
            </pre>
            <button 
              onClick={() => window.location.href = '/'}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-full font-medium transition-colors"
            >
              Return Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}
