type LogMeta = Record<string, unknown>;

const write = (level: "info" | "warn" | "error", message: string, meta?: LogMeta) => {
  const entry = JSON.stringify({
    level,
    message,
    meta,
    timestamp: new Date().toISOString()
  });

  if (level === "error") {
    console.error(entry);
    return;
  }

  if (level === "warn") {
    console.warn(entry);
    return;
  }

  console.info(entry);
};

export const logger = {
  info: (message: string, meta?: LogMeta) => write("info", message, meta),
  warn: (message: string, meta?: LogMeta) => write("warn", message, meta),
  error: (message: string, meta?: LogMeta) => write("error", message, meta)
};
