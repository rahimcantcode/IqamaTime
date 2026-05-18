/**
 * Scraper: Islamic Center of Rowlett
 * URL: https://icrmasjid.org
 * Method: axios + cheerio (Elementor icon-box structure)
 */
import axios from 'axios'
import { logger } from './logger'
import { normalizeTime } from './normalizeTime'
import { upsertPrayerTimes, logScrape, todayDate, TimesOnly } from './database'
import { sunsetPlus } from './sunsetUtils'

const MASJID_NAME = 'Islamic Center of Rowlett'
const URL = 'https://icrmasjid.org'

export async function scrapeICR(): Promise<void> {
  const start = logger.scrapeStart(MASJID_NAME)
  const date  = todayDate()

  try {
    const { data: html } = await axios.get(URL, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://www.google.com/',
      },
    })

    const times: TimesOnly = {
      fajr: null, dhuhr: null, asr: null, maghrib: null, isha: null,
      jummah1: null, jummah2: null,
    }

    // ICR uses Elementor icon-box widgets: h3 span = name, h5 = time
    // Also handles inline h3→h5 pairs via regex for safety
    const nameTimeRe = /<h3[^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>[\s\S]*?<\/h3>[\s\S]*?<h5[^>]*>([\s\S]*?)<\/h5>/gi
    let m: RegExpExecArray | null
    while ((m = nameTimeRe.exec(html)) !== null) {
      const name = m[1].trim().toLowerCase()
      const raw  = m[2].trim()
      // Skip if there's no recognizable time in the h5
      const timeVal = raw.match(/\d{1,2}:\d{2}\s*(?:AM|PM)/i)?.[0] ?? null

      if (name.includes('fajr'))                             times.fajr    = normalizeTime(timeVal ?? raw)
      if (name.includes('dhuhr') || name.includes('duhur') || name.includes('zuhr'))
                                                              times.dhuhr   = normalizeTime(timeVal ?? raw)
      if (name.includes('asr')  || name.includes('asar'))   times.asr     = normalizeTime(timeVal ?? raw)
      if (name.includes('maghrib'))                          times.maghrib  = normalizeTime(timeVal ?? raw)
      if (name.includes('isha'))                             times.isha    = normalizeTime(timeVal ?? raw)
      if (name.includes('jumu') || name.includes('jumma') || name.includes('jummah')) {
        // "Khutba 1:35PM" – extract the time part
        if (!times.jummah1) times.jummah1 = normalizeTime(timeVal ?? raw)
        else                times.jummah2 = normalizeTime(timeVal ?? raw)
      }
    }

    // ICR Maghrib iqamah is sunset + 10 min (no fixed time on website)
    if (!times.maghrib) times.maghrib = await sunsetPlus(10)

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
