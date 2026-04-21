/**
 * src/services/monitoring.ts
 * Sentry error monitoring — server-side (Node) initialisation.
 *
 * Setup:
 *   1. npm install @sentry/node @sentry/profiling-node
 *   2. Set SENTRY_DSN in your environment variables
 *   3. Import and call initSentry() at the very top of server.ts, before anything else
 *   4. Call sentryErrorHandler() after all routes in server.ts
 *
 * For the React frontend, see: src/sentryClient.ts
 */

// ─── SERVER (Node / Express) ─────────────────────────────────────────────────

let Sentry: typeof import('@sentry/node') | null = null;

export async function initSentry(): Promise<void> {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.warn('[Sentry] SENTRY_DSN not set — error monitoring disabled');
    return;
  }

  try {
    Sentry = await import('@sentry/node');
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV ?? 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
      // Capture unhandled promise rejections and exceptions automatically
      integrations: [
        Sentry.httpIntegration(),
        Sentry.expressIntegration(),
      ],
    });
    console.log('[Sentry] Initialised ✓');
  } catch (err) {
    console.warn('[Sentry] Failed to load @sentry/node — run: npm install @sentry/node', err);
  }
}

/**
 * Returns Express error handler middleware. Mount AFTER all routes.
 * Usage: app.use(sentryErrorHandler())
 */
export function sentryErrorHandler() {
  if (Sentry) {
    return Sentry.expressErrorHandler();
  }
  // Fallback no-op error handler
  return (err: any, _req: any, res: any, next: any) => {
    console.error('[Error]', err);
    if (res.headersSent) return next(err);
    res.status(err.status || 500).json({ success: false, error: 'Internal server error' });
  };
}

/**
 * Capture an error with optional context. Safe to call even if Sentry is not initialised.
 */
export function captureError(err: unknown, context?: Record<string, unknown>): void {
  if (Sentry) {
    Sentry.withScope(scope => {
      if (context) scope.setExtras(context);
      Sentry.captureException(err);
    });
  } else {
    console.error('[captureError]', err, context);
  }
}
