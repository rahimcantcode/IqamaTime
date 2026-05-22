/**
 * Scraper: Islamic Center of Irving
 * URL: https://www.irvingmasjid.org
 * Method: axios + cheerio
 *   - Daily prayer iqamah from .dpt_jamah elements (daily-prayer-time plugin)
 *   - Jummah from .rm-namaz-jumu list (2nd span = khutbah, 3rd span = iqamah)
 */
import axios from 'axios'
import * as cheerio from 'cheerio'
import { logger } from './logger'
import { normalizeTime } from './normalizeTime'
import { upsertPrayerTimes, logScrape, todayDate, TimesOnly } from './database'

const MASJID_NAME = 'Islamic Center of Irving'
const URL = 'https://www.irvingmasjid.org'

export async function scrapeICI(): Promise<void> {
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

    // Daily prayer iqamah: the dpt plugin wraps each prayer in an <li>
    // containing <span>Name:</span>, .dpt_start (adhan), .dpt_jamah (iqamah)
    $('li').each((_, li) => {
      const labelSpan = $(li).children('span').first().text().toLowerCase().trim()
      const iqamah   = $(li).find('.dpt_jamah').first().text().trim()
      if (!iqamah || !/\d/.test(iqamah)) return

      if (labelSpan.includes('fajr'))                              times.fajr    = normalizeTime(iqamah)
      if (labelSpan.includes('zuhr') || labelSpan.includes('dhuhr')) times.dhuhr = normalizeTime(iqamah)
      if (labelSpan.includes('asr'))                               times.asr     = normalizeTime(iqamah)
      if (labelSpan.includes('magrib') || labelSpan.includes('maghrib')) times.maghrib = normalizeTime(iqamah)
      if (labelSpan.includes('isha'))                              times.isha    = normalizeTime(iqamah)
    })

    // Jummah: .rm-namaz-jumu li → spans: [0]=label, [1]=khutbah, [2]=iqamah
    // Use khutbah time (when imam starts the khutbah), not iqamah
    let jumaIndex = 0
    $('.rm-namaz-jumu li, ul.rm-namaz-jumu li').each((_, li) => {
      const spans = $(li).find('span').map((_, s) => $(s).text().trim()).get()
      const khutbahTime = spans[1] ?? null
      if (!khutbahTime || !/\d/.test(khutbahTime)) return
      if (jumaIndex === 0) times.jummah1 = normalizeTime(khutbahTime)
      else                 times.jummah2 = normalizeTime(khutbahTime)
      jumaIndex++
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
