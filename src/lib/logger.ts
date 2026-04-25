type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

function log(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context !== undefined ? { context } : {}),
  };

  const output = JSON.stringify(entry);

  if (level === "error") {
    console.error(output);
  } else if (level === "warn") {
    console.warn(output);
  } else {
    console.log(output);
  }
}

export const logger = {
  info(message: string, context?: Record<string, unknown>): void {
    log("info", message, context);
  },
  warn(message: string, context?: Record<string, unknown>): void {
    log("warn", message, context);
  },
  error(message: string, context?: Record<string, unknown>): void {
    log("error", message, context);
  },
};
