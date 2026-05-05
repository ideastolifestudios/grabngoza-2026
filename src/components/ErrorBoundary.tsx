// src/components/ErrorBoundary.tsx — Global error boundary with Sentry reporting
import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Report to Sentry if available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        extra: { componentStack: errorInfo.componentStack },
      });
    }
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div style={{
          minHeight: '60vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '40px 20px',
          fontFamily: "'Helvetica Neue', sans-serif", textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 8px' }}>
            Something went wrong
          </h2>
          <p style={{ color: '#888', fontSize: '13px', maxWidth: '400px', margin: '0 0 24px' }}>
            We've been notified and are looking into it. Try refreshing the page.
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              background: '#000', color: '#fff', border: 'none', padding: '12px 32px',
              fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre style={{
              marginTop: '24px', padding: '16px', background: '#f5f5f5', border: '1px solid #eee',
              borderRadius: '4px', fontSize: '11px', textAlign: 'left', maxWidth: '600px',
              overflow: 'auto', color: '#c00',
            }}>
              {this.state.error.message}\n{this.state.error.stack}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
