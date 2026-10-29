import type { ScrapedPrayerTimes } from './database'
import { normalizeTime } from './normalizeTime'

export function validatePrayerTimes(data: ScrapedPrayerTimes): void {
  const daily = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const
  const missing = daily.filter(key => !data[key])
  if (missing.length) throw new Error(`Incomplete prayer schedule: missing ${missing.join(', ')}`)
  let previousMinutes = -1
  for (const key of [...daily, 'jummah1', 'jummah2', 'jummah3'] as const) {
    if (data[key] && normalizeTime(data[key]) !== data[key]) {
      throw new Error(`Invalid ${key} time: ${data[key]}`)
    }
    if (daily.includes(key as typeof daily[number]) && data[key]) {
      const match = data[key]!.match(/^(\d+):(\d+) (AM|PM)$/)!
      const minutes = (Number(match[1]) % 12 + (match[3] === 'PM' ? 12 : 0)) * 60 + Number(match[2])
      if (minutes <= previousMinutes) throw new Error(`Invalid daily prayer order at ${key}; refusing ambiguous or wrong-period times`)
      previousMinutes = minutes
    }
  }
}
