import type { PrayerCheckin } from './prayer-checkins'

export const PROGRESS_PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const
export type ProgressPrayer = typeof PROGRESS_PRAYERS[number]
export type DayLog = Record<ProgressPrayer, boolean>
export type WeekLog = Record<string, DayLog>

export function emptyDayLog(): DayLog {
  return { Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false }
}

export function getProgressWeek(today: string) {
  // Use a date-only UTC calendar for arithmetic: device timezone and DST must
  // never shift the Dallas day that was attached to a prayer check-in.
  const start = new Date(`${today}T12:00:00Z`)
  start.setUTCDate(start.getUTCDate() - (start.getUTCDay() + 6) % 7)
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
    const date = new Date(start)
    date.setUTCDate(start.getUTCDate() + index)
    return { day, dateKey: date.toISOString().slice(0, 10), shortDate: `${date.getUTCMonth() + 1}/${date.getUTCDate()}` }
  })
}

export function prayerKeysForSlot(date: string, prayer: string): string[] {
  const key = prayer.toLowerCase()
  if (new Date(`${date}T12:00:00Z`).getUTCDay() === 5 && ['dhuhr', 'jummah'].includes(key)) {
    return ['dhuhr', 'jummah']
  }
  return [key]
}

export function buildWeekLog(weekDates: { dateKey: string }[], checkins: PrayerCheckin[] = []): WeekLog {
  const result = Object.fromEntries(weekDates.map(({ dateKey }) => [dateKey, emptyDayLog()])) as WeekLog
  for (const checkin of checkins) {
    if (!result[checkin.date]) continue
    const key = prayerKeysForSlot(checkin.date, checkin.prayer)[0]
    const label = PROGRESS_PRAYERS.find(prayer => prayer.toLowerCase() === key)
    if (label) result[checkin.date][label] = true
  }
  return result
}
