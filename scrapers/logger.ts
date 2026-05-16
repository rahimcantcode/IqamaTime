type LogLevel = 'info' | 'success' | 'warn' | 'error'

const COLORS = {
  info:    '\x1b[36m',
  success: '\x1b[32m',
  warn:    '\x1b[33m',
  error:   '\x1b[31m',
  reset:   '\x1b[0m',
  dim:     '\x1b[2m',
}

function timestamp(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false })
}

function log(level: LogLevel, masjid: string, message: string, data?: unknown): void {
  const color = COLORS[level]
  const label = level.toUpperCase().padEnd(7)
  const prefix = `${COLORS.dim}${timestamp()}${COLORS.reset} ${color}${label}${COLORS.reset}`
  const masjidTag = masjid ? ` ${COLORS.dim}[${masjid}]${COLORS.reset}` : ''
  console.log(`${prefix}${masjidTag} ${message}`)
  if (data) console.log(`         `, data)
}

export const logger = {
  info:    (masjid: string, msg: string, data?: unknown) => log('info',    masjid, msg, data),
  success: (masjid: string, msg: string, data?: unknown) => log('success', masjid, msg, data),
  warn:    (masjid: string, msg: string, data?: unknown) => log('warn',    masjid, msg, data),
  error:   (masjid: string, msg: string, data?: unknown) => log('error',   masjid, msg, data),

  scrapeStart(masjid: string): number {
    log('info', masjid, 'Starting scrape...')
    return Date.now()
  },

  scrapeEnd(masjid: string, startTime: number, success: boolean): number {
    const duration = Date.now() - startTime
    if (success) {
      log('success', masjid, `Completed in ${duration}ms`)
    } else {
      log('error', masjid, `Failed after ${duration}ms`)
    }
    return duration
  },
}
