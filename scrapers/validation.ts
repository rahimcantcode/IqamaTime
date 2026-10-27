import type { ScrapedPrayerTimes } from './database'
import { normalizeTime } from './normalizeTime'

export function validatePrayerTimes(data: ScrapedPrayerTimes): void {
  const daily = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const
  const missing = daily.filter(key => !data[key])
  if (missing.length) throw new Error(`Incomplete prayer schedule: missing ${missing.join(', ')}`)
  for (const key of [...daily, 'jummah1', 'jummah2', 'jummah3'] as const) {
    if (data[key] && normalizeTime(data[key]) !== data[key]) {
      throw new Error(`Invalid ${key} time: ${data[key]}`)
    }
  }
}
