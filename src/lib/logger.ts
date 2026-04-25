/**
 * Structured logger for server-side use.
 *
 * In production: emits JSON lines to stdout — Vercel ingests these as
 * structured log entries (searchable by level/message in Vercel Logs).
 *
 * In development: pretty-prints to console with level prefix.
 */

type Level = "info" | "warn" | "error";

interface LogEntry {
  level: Level;
  message: string;
  ts: string;
  [key: string]: unknown;
}

function log(level: Level, message: string, context?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    message,
    ts: new Date().toISOString(),
    ...context,
  };

  if (process.env.NODE_ENV === "production") {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(entry));
  } else {
    const prefix = `[${entry.ts}] ${level.toUpperCase()}`;
    // eslint-disable-next-line no-console
    console[level](`${prefix} ${message}`, context ?? "");
  }
}

export const logger = {
  info:  (msg: string, ctx?: Record<string, unknown>) => log("info",  msg, ctx),
  warn:  (msg: string, ctx?: Record<string, unknown>) => log("warn",  msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => log("error", msg, ctx),
};
