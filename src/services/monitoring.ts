import * as Sentry from '@sentry/node';
export function initSentryServer() {
  if (!Sentry) return;
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
    integrations: [Sentry.httpIntegration(), Sentry.expressIntegration()],
  });
}
export function getSentryErrorHandler() {
  if (!Sentry) return (err: Error, req: any, res: any, next: any) => next(err);
  return Sentry.expressErrorHandler();
}
export function captureException(error: Error, context?: Record<string, any>) {
  if (Sentry) Sentry.captureException(error, { extra: context });
  else console.error('[Sentry] Error:', error.message);
}
