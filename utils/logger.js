const isDev = process.env.NODE_ENV !== 'production'

const fmt = (level, message, meta) => {
  const entry = { timestamp: new Date().toISOString(), level, message }
  if (meta && Object.keys(meta).length > 0) entry.meta = meta
  return JSON.stringify(entry)
}

const logger = {
  info:  (message, meta = {}) => console.log(fmt('info', message, meta)),
  warn:  (message, meta = {}) => console.warn(fmt('warn', message, meta)),
  error: (message, meta = {}) => console.error(fmt('error', message, meta)),
  debug: (message, meta = {}) => { if (isDev) console.log(fmt('debug', message, meta)) },
}

export default logger
