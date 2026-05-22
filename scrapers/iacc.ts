/**
 * Scraper: Islamic Association of Collin County
 * URL: https://planomasjid.org
 * Method: axios + cheerio (static HTML table)
 */
import axios from 'axios'
import * as cheerio from 'cheerio'
import { logger } from './logger'
import { normalizeTime } from './normalizeTime'
import { upsertPrayerTimes, logScrape, todayDate, TimesOnly } from './database'

const MASJID_NAME = 'Islamic Association of Collin County'
const URL = 'https://planomasjid.org'

export async function scrapeIACC(): Promise<void> {
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

    $('table tr').each((_, row) => {
      const cells = $(row).find('td, th').map((_, c) => $(c).text().trim()).get()
      if (cells.length < 2) return

      const name = cells[0].toLowerCase()
      // Prefer iqama time (last or second-to-last column)
      const time = cells[cells.length - 1]

      if (name.includes('fajr'))    times.fajr    = normalizeTime(time)
      if (name.includes('dhuhr') || name.includes('zuhr'))  times.dhuhr   = normalizeTime(time)
      if (name.includes('asr'))     times.asr     = normalizeTime(time)
      if (name.includes('maghrib')) times.maghrib  = normalizeTime(time)
      if (name.includes('isha'))    times.isha     = normalizeTime(time)
      if (name.includes('jumu') || name.includes('jumma')) {
        if (!times.jummah1) times.jummah1 = normalizeTime(time)
        else                times.jummah2 = normalizeTime(time)
      }
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
