/**
 * Normalize various time string formats to "h:mm AM/PM"
 * Handles: "13:45", "1:45 PM", "1:45PM", "01:45 am", "1345"
 */
export function normalizeTime(raw: string | null | undefined): string | null {
  if (!raw) return null
  const s = raw.trim().replace(/\s+/g, ' ')

  // Try 24-hour "HH:MM"
  const h24 = s.match(/^(\d{1,2}):(\d{2})$/)
  if (h24) {
    const h = parseInt(h24[1], 10)
    const m = parseInt(h24[2], 10)
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return to12Hour(h, m)
    }
  }

  // Try "H:MM AM/PM" or "H:MMAM/PM"
  const h12 = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (h12) {
    let h = parseInt(h12[1], 10)
    const m = parseInt(h12[2], 10)
    const period = h12[3].toUpperCase()
    if (period === 'PM' && h !== 12) h += 12
    if (period === 'AM' && h === 12) h = 0
    return to12Hour(h, m)
  }

  // Try "HHMM" 4-digit
  const d4 = s.match(/^(\d{4})$/)
  if (d4) {
    const h = parseInt(d4[0].slice(0, 2), 10)
    const m = parseInt(d4[0].slice(2),    10)
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return to12Hour(h, m)
    }
  }

  return null
}

function to12Hour(h24: number, m: number): string {
  const period = h24 >= 12 ? 'PM' : 'AM'
  let h = h24 % 12
  if (h === 0) h = 12
  return `${h}:${m.toString().padStart(2, '0')} ${period}`
}

/** Compare two time strings; returns negative if a < b */
export function compareTimesAsc(a: string | null, b: string | null): number {
  const toMinutes = (t: string | null): number => {
    if (!t) return Infinity
    const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i)
    if (!match) return Infinity
    let h = parseInt(match[1], 10)
    const m = parseInt(match[2], 10)
    const p = match[3].toUpperCase()
    if (p === 'PM' && h !== 12) h += 12
    if (p === 'AM' && h === 12) h = 0
    return h * 60 + m
  }
  return toMinutes(a) - toMinutes(b)
}
