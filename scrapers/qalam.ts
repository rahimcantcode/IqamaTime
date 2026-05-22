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
  return all[Math.min(activeIdx, all.length - 1)]
}

export async function scrapeQalam(): Promise<void> {
  const start = logger.scrapeStart(MASJID_NAME)
  const date  = todayDate()

  try {
    const { data: html } = await axios.get(URL, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IqamaTimeBot/1.0)' },
    })

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
      const today = new Date()
      let activeIdx = 0
      for (let i = 0; i < periodMatches.length; i++) {
        const month = parseInt(periodMatches[i][1])
        const day   = parseInt(periodMatches[i][2])
        const pd    = new Date(today.getFullYear(), month - 1, day)
        if (pd <= today) activeIdx = i
      }

      // Each line of the schedule is a prayer with potentially two times (one per period)
      for (const line of scheduleText.split('\n')) {
        const lower = line.toLowerCase()
        if (lower.includes('fajr'))    times.fajr    = normalizeTime(pickActiveTime(line, activeIdx))
        if (lower.includes('dhuhr') || lower.includes('zuhr'))
                                       times.dhuhr   = normalizeTime(pickActiveTime(line, activeIdx))
        if (lower.includes('asr') && !lower.includes('dhuhr'))
                                       times.asr     = normalizeTime(pickActiveTime(line, activeIdx))
        if (lower.includes('maghrib')) times.maghrib  = normalizeTime(pickActiveTime(line, activeIdx)) ?? await sunsetPlus(5)
        if (lower.includes('isha'))    times.isha    = normalizeTime(pickActiveTime(line, activeIdx))
      }
    }

    // Jummah block: separate section with "Salah: H:MM PM" (iqamah time)
    $('p, div').each((_, el) => {
      const text = $(el).text()
      if (!/Jumu|Jummah/i.test(text)) return

      const salahMatch   = text.match(/Salah[:\s]*(\d{1,2}:\d{2}\s*(?:AM|PM))/i)
      const khutbahMatch = text.match(/Khutbah[:\s]*(\d{1,2}:\d{2}\s*(?:AM|PM))/i)

      if (khutbahMatch)     times.jummah1 = normalizeTime(khutbahMatch[1])
      else if (salahMatch)  times.jummah1 = normalizeTime(salahMatch[1])
    })

    await upsertPrayerTimes({ masjidName: MASJID_NAME, date, sourceUrl: URL, ...times })
    const dur = logger.scrapeEnd(MASJID_NAME, start, true)
    await logScrape(MASJID_NAME, true, dur)
  } catch (err: unknown) {
    const dur = logger.scrapeEnd(MASJID_NAME, start, false)
    const msg = err instanceof Error ? err.message : String(err)
    logger.error(MASJID_NAME, msg)
    await logScrape(MASJID_NAME, false, dur, msg)
  }
}
