import type { PrayerKey } from '../types'

/** These sources publish relative sunset rules rather than a fixed Maghrib clock time. */
export function prayerTimeNote(masjidName: string, prayer: PrayerKey): string | undefined {
  if (prayer === 'maghrib' && ['Islamic Association of Allen', 'Qalam Masjid', 'Qalam Institute'].includes(masjidName)) {
    return 'Sunset-based schedule; verify with masjid'
  }
  return undefined
}
