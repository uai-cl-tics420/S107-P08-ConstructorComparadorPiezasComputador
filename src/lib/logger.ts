/**
 * Niveles disponibles (en orden de severidad):
 *   DEBUG < INFO < WARN < ERROR

 * Formato:
 *   [YYYY-MM-DD HH:mm:ss.mmm] [LEVEL] [context] mensaje  {meta?}
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// Colores ANSI
const COLORS: Record<LogLevel, string> = {
  DEBUG: '\x1b[36m', // cyan
  INFO:  '\x1b[32m', // green
  WARN:  '\x1b[33m', // yellow
  ERROR: '\x1b[31m', // red
};
const RESET = '\x1b[0m';

function resolveMinLevel(): LogLevel {
  const env = (process.env.LOG_LEVEL ?? '').toUpperCase() as LogLevel;
  if (env in LEVEL_PRIORITY) return env;
  return process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG';
}

const MIN_LEVEL: LogLevel = resolveMinLevel();
const USE_COLOR = process.env.NODE_ENV !== 'production';

function timestamp(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 23);
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[MIN_LEVEL];
}

function format(level: LogLevel, context: string, message: string, meta?: unknown): string {
  const ts    = timestamp();
  const ctx   = context ? `[${context}]` : '';
  const metaStr = meta !== undefined ? `  ${JSON.stringify(meta)}` : '';

  if (USE_COLOR) {
    const color = COLORS[level];
    return `${color}[${ts}] [${level}] ${ctx}${RESET} ${message}${metaStr}`;
  }

  return `[${ts}] [${level}] ${ctx} ${message}${metaStr}`;
}

function write(level: LogLevel, context: string, message: string, meta?: unknown): void {
  if (!shouldLog(level)) return;

  const line = format(level, context, message, meta);

  if (level === 'ERROR' || level === 'WARN') {
    console.error(line);
  } else {
    console.log(line);
  }
}

export function createLogger(context: string) {
  return {
    debug: (message: string, meta?: unknown) => write('DEBUG', context, message, meta),
    info:  (message: string, meta?: unknown) => write('INFO',  context, message, meta),
    warn:  (message: string, meta?: unknown) => write('WARN',  context, message, meta),
    error: (message: string, meta?: unknown) => write('ERROR', context, message, meta),
  };
}

export const logger = createLogger('app');
