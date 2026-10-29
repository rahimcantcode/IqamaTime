/**
 * Scraper: Qalam Masjid
 * URL: https://qalamcampus.org
 * Method: Parse text-based schedule with date-range columns ("From M/D")
 *         Must convert <br> to \n before text extraction (schedule uses <br> for rows)
 */
import axios from 'axios'
import * as cheerio from 'cheerio'
import { logger } from './logger'
import { normalizeTime } from './normalizeTime'
import { upsertPrayerTimes, logScrape, todayDate, TimesOnly } from './database'
import { sunsetPlus } from './sunsetUtils'

const MASJID_NAME = 'Qalam Masjid'
const URL = 'https://qalamcampus.org'

function pickActiveTime(line: string, activeIdx: number): string | null {
  const all = [...line.matchAll(/\d{1,2}:\d{2}\s*(?:AM|PM)/gi)].map(m => m[0])
  if (all.length === 0) return null
  return all.length === 1 ? all[0] : all[activeIdx] ?? null
}

export async function parseQalamTimes(html: string, date: string, resolveSunset = sunsetPlus): Promise<TimesOnly> {
  const $ = cheerio.load(html)
  const times: TimesOnly = {
    fajr: null, dhuhr: null, asr: null, maghrib: null, isha: null,
    jummah1: null, jummah2: null, jummah3: null,
  }

  // Find the schedule <p> that contains "From M/D" date headers and prayer names
  let scheduleText = ''
  $('p').each((_, el) => {
    // Convert <br> to newlines before extracting text — critical for line-based parsing
    $(el).find('br').replaceWith('\n')
    const text = $(el).text()
    if (/From\s+\d+\/\d+/i.test(text) && /Fajr/i.test(text)) {
      scheduleText = text
      return false  // break
    }
  })

  if (scheduleText) {
    // Find all "From M/D" period start dates and determine which is active
    const periodMatches = [...scheduleText.matchAll(/From\s+(\d+)\/(\d+)/gi)]
    const periods = periodMatches.map(match => [Number(match[1]), Number(match[2])] as const)
    const year = Number(date.slice(0, 4))
    const month = Number(date.slice(5, 7))
    const wrapsYear = periods.some((period, index) => index > 0 && period[0] < periods[index - 1][0])
    let scheduleYear = wrapsYear && month < periods[0][0] ? year - 1 : year
    let activeIdx = -1
    for (let i = 0; i < periods.length; i++) {
      if (i > 0 && periods[i][0] < periods[i - 1][0]) scheduleYear++
      const [periodMonth, day] = periods[i]
      const periodDate = `${scheduleYear}-${String(periodMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      if (periodDate <= date) activeIdx = i
    }
    if (activeIdx < 0) throw new Error(`Qalam has no active period for Dallas date ${date}`)

    // Each line of the schedule is a prayer with potentially two times (one per period)
    for (const line of scheduleText.split('\n')) {
      const lower = line.toLowerCase()
      if (lower.includes('fajr'))    times.fajr    = normalizeTime(pickActiveTime(line, activeIdx))
      if (lower.includes('dhuhr') || lower.includes('zuhr'))
                                     times.dhuhr   = normalizeTime(pickActiveTime(line, activeIdx))
      if (lower.includes('asr') && !lower.includes('dhuhr'))
                                     times.asr     = normalizeTime(pickActiveTime(line, activeIdx))
      if (lower.includes('maghrib')) {
        times.maghrib = normalizeTime(pickActiveTime(line, activeIdx))
        if (!times.maghrib && /sunset/i.test(line) && /5\s*minutes?\s*after\s*adhan/i.test(line)) {
          times.maghrib = await resolveSunset(5, { city: 'Carrollton', date })
        }
      }
      if (lower.includes('isha'))    times.isha    = normalizeTime(pickActiveTime(line, activeIdx))
    }
  }

  // Friday values are khutbah starts, never substituted with a later salah start.
  $('p, div').each((_, el) => {
    const text = $(el).text()
    if (!/Jumu|Jummah/i.test(text)) return

    const khutbahMatch = text.match(/Khutbah[:\s]*(\d{1,2}:\d{2}\s*(?:AM|PM))/i)

    if (khutbahMatch)     times.jummah1 = normalizeTime(khutbahMatch[1])
  })

  return times
}

export async function scrapeQalam(): Promise<void> {
  const start = logger.scrapeStart(MASJID_NAME)
  const date  = todayDate()

  try {
    const { data: html } = await axios.get(URL, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IqamaTimeBot/1.0)' },
    })

    const times = await parseQalamTimes(html as string, date)

    await upsertPrayerTimes({ masjidName: MASJID_NAME, date, sourceUrl: URL, ...times })
    const dur = logger.scrapeEnd(MASJID_NAME, start, true)
    await logScrape(MASJID_NAME, true, dur)
  } catch (err: unknown) {
    const dur = logger.scrapeEnd(MASJID_NAME, start, false)
    const msg = err instanceof Error ? err.message : String(err)
    logger.error(MASJID_NAME, msg)
    await logScrape(MASJID_NAME, false, dur, msg)
    throw err
  }
}
