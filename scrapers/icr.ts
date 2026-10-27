/**
 * Scraper: Islamic Center of Rowlett
 * URL: https://icrmasjid.org
 * Method: axios + regex against prayer section markup/text
 */
import axios from 'axios'
import * as cheerio from 'cheerio'
import { logger } from './logger'
import { normalizeTime } from './normalizeTime'
import { upsertPrayerTimes, logScrape, todayDate, TimesOnly, ensureMasjid } from './database'

const MASJID_NAME = 'Islamic Center of Rowlett'
const PAGE_URL = 'https://icrmasjid.org'

export function parseCMZTimes(html: string): TimesOnly {
  const $ = cheerio.load(html)
  $('script, style').remove()
  const times: TimesOnly = { fajr: null, dhuhr: null, asr: null, maghrib: null, isha: null, jummah1: null, jummah2: null, jummah3: null }
  // The full-height cards label iqamah explicitly; avoid responsive duplicates.
  $('h3').each((_, heading) => {
    const key = $(heading).text().trim().toLowerCase() as keyof TimesOnly
    if (!['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(key)) return
    const card = $(heading).parent()
    const label = card.children('p').filter((_, p) => $(p).text().trim() === 'Iqamah').first()
    const time = normalizeTime(label.next('p').text())
    if (time) times[key] = time
  })
  return times
}

export async function scrapeICR(): Promise<void> {
  const start = logger.scrapeStart(MASJID_NAME)
  const date  = todayDate()

  try {
    await ensureMasjid({ name: MASJID_NAME, city: 'Rowlett', websiteUrl: PAGE_URL })
    const { data: html } = await axios.get(PAGE_URL, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })

    const $ = cheerio.load(html as string)
    const src = $('iframe').map((_, el) => $(el).attr('src')).get().find(src => {
      try { return new URL(src).hostname === 'cmzapp.com' } catch { return false }
    })
    if (!src) throw new Error('CMZ prayer widget not found on ICR website')
    const { data: widget } = await axios.get(src, { timeout: 45000 })
    const times = parseCMZTimes(widget as string)
    const text = $('body').text().replace(/\s+/g, ' ')
    const jummah = text.match(/Jumm(?:ay|ah|a)[^0-9]{0,30}(\d{1,2}:\d{2}\s*(?:AM|PM))/i)
    times.jummah1 = normalizeTime(jummah?.[1])

    await upsertPrayerTimes({ masjidName: MASJID_NAME, date, sourceUrl: PAGE_URL, ...times })
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
