// api../internal/utils/_logger.ts — Structured JSON logging for Vercel Functions
// Usage: import { createLogger } from '../internal/utils/_logger';
//        const log = createLogger('payments');
//        log.info('checkout_created', { orderId, amountCents });

type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  ts: string;
  level: LogLevel;
  service: string;
  event: string;
  [key: string]: any;
}

function emit(entry: LogEntry) {
  const line = JSON.stringify(entry);
  if (entry.level === 'error') console.error(line);
  else if (entry.level === 'warn') console.warn(line);
  else console.log(line);
}

export function createLogger(service: string) {
  return {
    info:  (event: string, data?: Record<string, any>) =>
      emit({ ts: new Date().toISOString(), level: 'info',  service, event, ...data }),
    warn:  (event: string, data?: Record<string, any>) =>
      emit({ ts: new Date().toISOString(), level: 'warn',  service, event, ...data }),
    error: (event: string, data?: Record<string, any>) =>
      emit({ ts: new Date().toISOString(), level: 'error', service, event, ...data }),
    /** Time an async operation and log it */
    async time<T>(event: string, fn: () => Promise<T>, extra?: Record<string, any>): Promise<T> {
      const start = Date.now();
      try {
        const result = await fn();
        emit({ ts: new Date().toISOString(), level: 'info', service, event, duration_ms: Date.now() - start, ...extra });
        return result;
      } catch (err: any) {
        emit({ ts: new Date().toISOString(), level: 'error', service, event, duration_ms: Date.now() - start, error: err.message, ...extra });
        throw err;
      }
    },
  };
}
