export interface PrayerCheckin {
  id: string
  date: string        // YYYY-MM-DD local date
  prayer: string      // fajr | dhuhr | asr | maghrib | isha | jummah
  prayerLabel: string // Fajr | Dhuhr | etc.
  adhanTime: string
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'iqamatime_checkins'

export function getLocalDate(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function getPrayerCheckins(): PrayerCheckin[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function getPrayerCheckinForDateAndPrayer(
  date: string,
  prayer: string
): PrayerCheckin | null {
  return getPrayerCheckins().find(c => c.date === date && c.prayer === prayer) ?? null
}

export function hasPrayerCheckin(date: string, prayer: string): boolean {
  return !!getPrayerCheckinForDateAndPrayer(date, prayer)
}

export function savePrayerCheckin(
  data: Omit<PrayerCheckin, 'id' | 'createdAt' | 'updatedAt'>
): PrayerCheckin {
  const checkins = getPrayerCheckins()
  const idx = checkins.findIndex(c => c.date === data.date && c.prayer === data.prayer)
  const now = new Date().toISOString()

  if (idx !== -1) {
    const updated = { ...checkins[idx], ...data, updatedAt: now }
    checkins[idx] = updated
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checkins))
    return updated
  }

  const newCheckin: PrayerCheckin = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }
  checkins.push(newCheckin)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(checkins))
  return newCheckin
}

export function removePrayerCheckin(date: string, prayer: string): void {
  if (typeof window === 'undefined') return
  const filtered = getPrayerCheckins().filter(
    c => !(c.date === date && c.prayer === prayer)
  )
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}
