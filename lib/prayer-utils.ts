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

/** Prayer gradient config */
export const PRAYER_GRADIENTS: Record<PrayerKey, string> = {
  fajr:    'from-indigo-950 via-slate-950 to-[#080810]',
  dhuhr:   'from-emerald-950 via-slate-950 to-[#080810]',
  asr:     'from-amber-950 via-slate-950 to-[#080810]',
  maghrib: 'from-orange-950 via-slate-950 to-[#080810]',
  isha:    'from-violet-950 via-slate-950 to-[#080810]',
  jummah:  'from-emerald-900 via-slate-950 to-[#080810]',
}

export const PRAYER_GLOW: Record<PrayerKey, string> = {
  fajr:    'rgba(99,102,241,0.15)',
  dhuhr:   'rgba(16,185,129,0.15)',
  asr:     'rgba(245,158,11,0.15)',
  maghrib: 'rgba(249,115,22,0.15)',
  isha:    'rgba(139,92,246,0.15)',
  jummah:  'rgba(16,185,129,0.2)',
}

export const PRAYER_ACCENT: Record<PrayerKey, string> = {
  fajr:    '#818cf8',
  dhuhr:   '#34d399',
  asr:     '#fbbf24',
  maghrib: '#fb923c',
  isha:    '#a78bfa',
  jummah:  '#34d399',
}
