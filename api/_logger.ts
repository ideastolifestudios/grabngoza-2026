// api/_logger.ts — Structured JSON logging for Vercel Functions
type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  service: string;
  action: string;
  message: string;
  orderId?: string;
  duration_ms?: number;
  [key: string]: any;
}

function log(entry: LogEntry) {
  const out = { ts: new Date().toISOString(), ...entry };
  if (entry.level === 'error') {
    console.error(JSON.stringify(out));
  } else if (entry.level === 'warn') {
    console.warn(JSON.stringify(out));
  } else {
    console.log(JSON.stringify(out));
  }
}

export function createLogger(service: string) {
  return {
    info:  (action: string, message: string, extra?: Record<string, any>) =>
      log({ level: 'info',  service, action, message, ...extra }),
    warn:  (action: string, message: string, extra?: Record<string, any>) =>
      log({ level: 'warn',  service, action, message, ...extra }),
    error: (action: string, message: string, extra?: Record<string, any>) =>
      log({ level: 'error', service, action, message, ...extra }),
  };
}
