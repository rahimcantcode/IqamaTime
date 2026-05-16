/**
 * Scraper: EPIC Masjid
 * URL: https://epicmasjid.org
 * Method: axios + cheerio — parse prayer/iqama table
 */
import axios from 'axios'
import * as cheerio from 'cheerio'
import { logger } from './logger'
import { normalizeTime } from './normalizeTime'
import { upsertPrayerTimes, logScrape, todayDate, TimesOnly } from './database'

const MASJID_NAME = 'EPIC Masjid'
const URL = 'https://epicmasjid.org'

export async function scrapeEPIC(): Promise<void> {
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
      jummah1: null, jummah2: null,
    }

    // EPIC usually has a table with columns: Prayer | Adhan | Iqama
    // We want the Iqama column (index 2, 0-based)
    $('table').each((_, table) => {
      $(table).find('tr').each((_, row) => {
        const cells = $(row).find('td, th').map((_, c) => $(c).text().trim()).get()
        if (cells.length < 2) return

        const name = cells[0].toLowerCase()
        // Iqama is typically the last time column
        const iqama = cells[cells.length - 1]

        if (name.includes('fajr'))                    times.fajr    = normalizeTime(iqama)
        if (name.includes('dhuhr') || name.includes('zuhr')) times.dhuhr = normalizeTime(iqama)
        if (name.includes('asr'))                     times.asr     = normalizeTime(iqama)
        if (name.includes('maghrib'))                 times.maghrib  = normalizeTime(iqama)
        if (name.includes('isha'))                    times.isha     = normalizeTime(iqama)
        if (name.includes('jumu') || name.includes('jumma')) {
          if (!times.jummah1) times.jummah1 = normalizeTime(iqama)
          else                times.jummah2 = normalizeTime(iqama)
        }
      })
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
