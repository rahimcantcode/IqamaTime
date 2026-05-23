import { PrayerKey, PrayerMeta } from '@/types'

export const ALL_PRAYERS: PrayerMeta[] = [
  { key: 'fajr',    displayName: 'Fajr',     arabicName: 'الفجر' },
  { key: 'dhuhr',   displayName: 'Dhuhr',    arabicName: 'الظهر' },
  { key: 'asr',     displayName: 'Asr',      arabicName: 'العصر' },
  { key: 'maghrib', displayName: 'Maghrib',  arabicName: 'المغرب' },
  { key: 'isha',    displayName: 'Isha',      arabicName: 'العشاء' },
]

export const JUMMAH_META: PrayerMeta = {
  key: 'jummah',
  displayName: "Jumu'ah",
  arabicName: 'الجمعة',
}

export function getPrayersForDay(isFriday: boolean): PrayerMeta[] {
  return ALL_PRAYERS.map(p =>
    p.key === 'dhuhr' && isFriday ? JUMMAH_META : p
  )
}

/** Parse "1:45 PM", "13:45", "01:45 am" → [hours24, minutes] */
export function parseTime(timeStr: string): [number, number] | null {
  if (!timeStr) return null
  const clean = timeStr.trim()
  const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
  if (!match) return null

  let h = parseInt(match[1], 10)
  const m = parseInt(match[2], 10)
  const period = match[3]?.toUpperCase()

  if (period === 'PM' && h !== 12) h += 12
  if (period === 'AM' && h === 12) h = 0

  return [h, m]
}

/** Convert a time string to today's Date object */
export function timeStrToDate(timeStr: string): Date | null {
  const parts = parseTime(timeStr)
  if (!parts) return null
  const d = new Date()
  d.setHours(parts[0], parts[1], 0, 0)
  return d
}

/** Format seconds into "1h 47m" or "47:23" */
export function formatCountdownCompact(seconds: number): string {
  if (seconds <= 0) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** Human-readable countdown */
export function formatCountdownText(seconds: number): string {
  if (seconds <= 0) return 'now'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0 && m > 0) return `${h}h ${m}m remaining`
  if (h > 0) return `${h} hour${h > 1 ? 's' : ''} remaining`
  if (m > 0) return `${m} minute${m > 1 ? 's' : ''} remaining`
  return 'Less than a minute'
}

/** Which prayer index is next (0-4), given prayer adhan times */
export function getNextPrayerIndex(
  prayerTimes: Record<PrayerKey, string | null>,
  isFriday: boolean
): number {
  const prayers = getPrayersForDay(isFriday)
  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  for (let i = 0; i < prayers.length; i++) {
    const key = prayers[i].key
    const raw = key === 'jummah' ? (prayerTimes.dhuhr ?? prayerTimes.jummah) : prayerTimes[key]
    if (!raw) continue
    const parts = parseTime(raw)
    if (!parts) continue
    const prayerMinutes = parts[0] * 60 + parts[1]
    if (prayerMinutes > nowMinutes) return i
  }

  return 0 // after Isha → next is Fajr
}

/** Seconds remaining until a prayer time (negative if past) */
export function secondsUntil(timeStr: string | null): number {
  if (!timeStr) return 0
  const target = timeStrToDate(timeStr)
  if (!target) return 0
  return Math.floor((target.getTime() - Date.now()) / 1000)
}

/** Get Hijri date string using Intl */
export function getHijriDate(): string {
  try {
    const hijri = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date())
    return hijri
  } catch {
    return ''
  }
}

/** Prayer gradient config — sky-progression tints from dawn to night */
export const PRAYER_GRADIENTS: Record<PrayerKey, string> = {
  fajr:    'from-indigo-50 to-white',
  dhuhr:   'from-amber-50 to-white',
  asr:     'from-orange-50 to-white',
  maghrib: 'from-red-50 to-white',
  isha:    'from-blue-50 to-white',
  jummah:  'from-green-50 to-white',
}

/** Radial glow color behind each prayer card */
export const PRAYER_GLOW: Record<PrayerKey, string> = {
  fajr:    'rgba(79,92,210,0.22)',
  dhuhr:   'rgba(217,158,0,0.26)',
  asr:     'rgba(234,110,20,0.22)',
  maghrib: 'rgba(220,75,40,0.22)',
  isha:    'rgba(30,58,138,0.22)',
  jummah:  'rgba(79,111,82,0.26)',
}

/** Per-prayer accent color — all values ≥4.5:1 on white */
export const PRAYER_ACCENT: Record<PrayerKey, string> = {
  fajr:    '#3B4BC5',   // indigo   6.9:1
  dhuhr:   '#7A5A0A',   // amber    6.3:1
  asr:     '#9A4E10',   // sienna   6.0:1
  maghrib: '#9D2D0E',   // sunset   6.8:1
  isha:    '#1E3A6E',   // navy    11.2:1
  jummah:  '#4F6F52',   // green    6.2:1
}
