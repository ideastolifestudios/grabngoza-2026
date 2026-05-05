import React from 'react';
import * as Sentry from '@sentry/react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const DefaultFallback = () => (
  <div style={{
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#0a0a0a', color: '#fff', fontFamily: "'Helvetica Neue', Arial, sans-serif",
  }}>
    <div style={{ textAlign: 'center', maxWidth: 400 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
      <h2 style={{ fontSize: 20, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
        Something Went Wrong
      </h2>
      <p style={{ color: '#666', fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
        We've been notified and are working on it. Please try refreshing the page.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          background: '#fff', color: '#000', border: 'none', padding: '12px 32px',
          fontSize: 10, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        Refresh Page
      </button>
    </div>
  </div>
);

export const ErrorBoundary: React.FC<Props> = ({ children, fallback }) => (
  <Sentry.ErrorBoundary
    fallback={fallback || <DefaultFallback />}
    onError={(error, componentStack) => {
      console.error('[ErrorBoundary]', error, componentStack);
    }}
  >
    {children}
  </Sentry.ErrorBoundary>
);

export default ErrorBoundary;
