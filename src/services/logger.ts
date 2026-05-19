/**
 * src/services/logger.ts
 * Structured JSON logger — outputs to stdout which Vercel/Express captures.
 * All entries are machine-readable for log aggregation (Sentry, Datadog, etc.).
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  ts: string;
  level: Level;
  event: string;
  env: string;
  [key: string]: unknown;
}

export function log(level: Level, event: string, data?: Record<string, unknown>): void {
  const entry: LogEntry = {
    ts: new Date().toISOString(),
    level,
    event,
    env: process.env.NODE_ENV ?? 'development',
    ...data,
  };

  const line = JSON.stringify(entry);
  if (level === 'error' || level === 'warn') {
    console.error(line);
  } else {
    console.log(line);
  }
}

// Convenience wrappers
export const logger = {
  debug: (event: string, data?: Record<string, unknown>) => log('debug', event, data),
  info:  (event: string, data?: Record<string, unknown>) => log('info',  event, data),
  warn:  (event: string, data?: Record<string, unknown>) => log('warn',  event, data),
  error: (event: string, data?: Record<string, unknown>) => log('error', event, data),
};
