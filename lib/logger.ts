type LogLevel = 'info' | 'warn' | 'error'

interface LogMeta {
  [key: string]: any
}

function fmt(level: LogLevel, message: string, meta?: LogMeta) {
  const base = {
    ts: new Date().toISOString(),
    level,
    message,
  }
  // Avoid circular structures
  let safeMeta: any = undefined
  if (meta) {
    try {
      JSON.stringify(meta)
      safeMeta = meta
    } catch {
      safeMeta = { note: 'meta not serializable' }
    }
  }
  return JSON.stringify(safeMeta ? { ...base, ...safeMeta } : base)
}

export const logger = {
  info: (message: string, meta?: LogMeta) => console.log(fmt('info', message, meta)),
  warn: (message: string, meta?: LogMeta) => console.warn(fmt('warn', message, meta)),
  error: (message: string, meta?: LogMeta) => console.error(fmt('error', message, meta)),
}
