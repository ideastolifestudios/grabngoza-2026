// @ts-nocheck
// internal/lib/logger.ts
type Level = 'info' | 'warn' | 'error';

export function createLogger(prefix: string) {
  const emit = (level: Level, event: string, meta?: any) => {
    const entry = JSON.stringify({
      ts:      new Date().toISOString(),
      level,
      service: prefix,
      event,
      ...(meta && typeof meta === 'object' ? meta : { detail: meta }),
    });
    if (level === 'error') console.error(entry);
    else if (level === 'warn')  console.warn(entry);
    else                        console.log(entry);
  };
  return {
    info:  (event: string, meta?: any) => emit('info',  event, meta),
    warn:  (event: string, meta?: any) => emit('warn',  event, meta),
    error: (event: string, meta?: any) => emit('error', event, meta),
  };
}
