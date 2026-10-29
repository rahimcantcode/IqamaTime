/** SMS's official MadinaAPPS widget. Never replace missing source data with guesses. */
import axios from 'axios'
import { logger } from './logger'
import { normalizeTime } from './normalizeTime'
import { upsertPrayerTimes, logScrape, todayDate, TimesOnly } from './database'
import { validatePrayerTimes } from './validation'

const MASJID_NAME = 'SMS Masjid of Sachse'
const URL = 'https://sachsemasjid.org'

interface MnPrayerEntry { iqamahTime?: string }
interface MnDay {
  date?: string
  fajr?: MnPrayerEntry
  dhuhr?: MnPrayerEntry
  asr?: MnPrayerEntry
  maghrib?: MnPrayerEntry
  isha?: MnPrayerEntry
  jumaTimes?: Array<{ khutbaTime?: string }>
}

/** Extract JSON, not executable JavaScript; tolerate minification and nested braces. */
function widgetJSON(html: string): string {
  const assignment = /\b(?:var|let|const)\s+mn\s*=\s*\{/.exec(html)
  if (!assignment) {
    if (/\[MadinaAPPS-(?:Daily|Friday)/i.test(html)) {
      throw new Error('Sachse source unavailable: official website is showing unrendered MadinaAPPS prayer shortcodes; existing times preserved')
    }
    throw new Error('Sachse source unavailable: official MadinaAPPS prayer data is missing; existing times preserved')
  }
  const start = assignment.index + assignment[0].lastIndexOf('{')
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < html.length; i++) {
    const char = html[i]
    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
    } else if (char === '"') inString = true
    else if (char === '{') depth++
    else if (char === '}' && --depth === 0) return html.slice(start, i + 1)
  }
  throw new Error('Sachse source unavailable: incomplete MadinaAPPS JSON')
}

export function parseSMSTimes(html: string, date: string): TimesOnly {
  const data = JSON.parse(widgetJSON(html)) as { prayerTimes?: MnDay[] }
  const days = data.prayerTimes
  if (!Array.isArray(days) || !days.length) throw new Error('Sachse source unavailable: prayerTimes is empty')
  const dated = days.some(day => typeof day.date === 'string')
  // An explicitly dated schedule must match Dallas today. Do not silently take tomorrow.
  const day = dated ? days.find(day => day.date?.slice(0, 10) === date) : days.length === 1 ? days[0] : undefined
  if (!day) throw new Error(`Sachse source unavailable: no unambiguous prayer schedule for ${date}`)
  const times: TimesOnly = {
    fajr: normalizeTime(day.fajr?.iqamahTime),
    dhuhr: normalizeTime(day.dhuhr?.iqamahTime),
    asr: normalizeTime(day.asr?.iqamahTime),
    maghrib: normalizeTime(day.maghrib?.iqamahTime),
    isha: normalizeTime(day.isha?.iqamahTime),
    jummah1: normalizeTime(day.jumaTimes?.[0]?.khutbaTime),
    jummah2: normalizeTime(day.jumaTimes?.[1]?.khutbaTime),
    jummah3: normalizeTime(day.jumaTimes?.[2]?.khutbaTime),
  }
  validatePrayerTimes({ masjidName: MASJID_NAME, date, ...times })
  return times
}

export async function scrapeSMS(): Promise<void> {
  const start = logger.scrapeStart(MASJID_NAME)
  const date = todayDate()
  try {
    const { data: html } = await axios.get(URL, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IqamaTimeBot/1.0)' },
    })
    const times = parseSMSTimes(html as string, date)
    await upsertPrayerTimes({ masjidName: MASJID_NAME, date, sourceUrl: URL, ...times })
    const duration = logger.scrapeEnd(MASJID_NAME, start, true)
    await logScrape(MASJID_NAME, true, duration)
  } catch (error: unknown) {
    const duration = logger.scrapeEnd(MASJID_NAME, start, false)
    const message = error instanceof Error ? error.message : String(error)
    logger.error(MASJID_NAME, message)
    await logScrape(MASJID_NAME, false, duration, message)
    throw error
  }
}
