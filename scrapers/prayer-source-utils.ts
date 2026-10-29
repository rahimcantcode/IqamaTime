import type { TimesOnly } from './database'
import { normalizeTime } from './normalizeTime'

export function emptyTimes(): TimesOnly {
  return { fajr: null, dhuhr: null, asr: null, maghrib: null, isha: null, jummah1: null, jummah2: null, jummah3: null }
}

/** Preserve up to three distinct published khutbah starts, including responsive duplicates. */
export function addFridayTime(times: TimesOnly, raw: string | null | undefined): void {
  const time = normalizeTime(raw)
  if (!time || [times.jummah1, times.jummah2, times.jummah3].includes(time)) return
  if (!times.jummah1) times.jummah1 = time
  else if (!times.jummah2) times.jummah2 = time
  else if (!times.jummah3) times.jummah3 = time
}
