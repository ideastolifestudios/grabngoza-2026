/**
 * src/sentryClient.ts
 * Sentry React (browser) initialisation.
 *
 * Setup:
 *   1. npm install @sentry/react
 *   2. Set VITE_SENTRY_DSN in .env / Vercel env vars
 *   3. Import this file at the very top of src/main.tsx, before React renders:
 *        import './sentryClient';
 */

import * as Sentry from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

if (dsn) {
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Capture 20% of transactions in production, 100% in dev
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
    // Replay 10% of sessions, 100% on errors
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
  });
  console.log('[Sentry] Client initialised ✓');
} else {
  console.warn('[Sentry] VITE_SENTRY_DSN not set — client error monitoring disabled');
}

export { Sentry };
