import { AdhanTimes } from '@/types'

const EMPTY: AdhanTimes = { fajr: null, dhuhr: null, asr: null, maghrib: null, isha: null }

function to12Hour(time24: string): string | null {
  if (!time24) return null
  const parts = time24.split(':')
  const h = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  if (isNaN(h) || isNaN(m)) return null
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`
}

// Richardson, TX — ISNA calculation method (standard North America)
// Include the CT-local date in the URL so the Next.js fetch cache key changes
// at midnight CT, preventing stale adhan times after midnight.
function ctDateString(): string {
  return new Date()
    .toLocaleDateString('en-GB', {
      timeZone: 'America/Chicago',
      day: '2-digit', month: '2-digit', year: 'numeric',
    })
    .replace(/\//g, '-') // "15/05/2026" → "15-05-2026"
}

export async function fetchAdhanTimes(): Promise<AdhanTimes> {
  const url = `https://api.aladhan.com/v1/timingsByCity/${ctDateString()}?city=Richardson&country=US&method=2`
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return EMPTY
    const json = await res.json()
    const t = json?.data?.timings
    if (!t) return EMPTY
    return {
      fajr:    to12Hour(t.Fajr),
      dhuhr:   to12Hour(t.Dhuhr),
      asr:     to12Hour(t.Asr),
      maghrib: to12Hour(t.Maghrib),
      isha:    to12Hour(t.Isha),
    }
  } catch {
    return EMPTY
  }
}
