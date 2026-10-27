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
// Official CMZ widget published in ICR's homepage iframe. The embed token is public.
const WIDGET_URL = "https://cmzapp.com/cmz/widget/prayer-timing?language=en&token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhc3NldFR5cGUiOiJldmVudHMiLCJtYXNqaWRJZCI6IjY1ZWZhZTJlOGIyMmEwYTM2ZGMyNGY2NiIsInVzZXJJZCI6IjY1ZjllOWMxOGIyMmEwYTM2ZGNkOTFjZSJ9.XOxlMPk6m6m-5ZL1XTw4pm3VSV7PzrSrQ0ROZHTwbjc&entityType=MASJID&lat=32.886075487678745&lon=-96.53675190963816"

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
    const { data: widget } = await axios.get(WIDGET_URL, { timeout: 45000 })
    const times = parseCMZTimes(widget as string)
    // Friday khutbah is published on the homepage, independently of daily times.
    // A homepage outage must not discard a valid daily CMZ schedule.
    try {
      const { data: html } = await axios.get(PAGE_URL, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36', 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.9' } })
      const $ = cheerio.load(html as string)
      const text = $('body').text().replace(/\s+/g, ' ')
      const jummah = text.match(/Jumm(?:ay|ah|a)[^0-9]{0,30}(\d{1,2}:\d{2}\s*(?:AM|PM))/i)
      times.jummah1 = normalizeTime(jummah?.[1])
    } catch (error) {
      logger.warn(MASJID_NAME, 'Friday source unavailable: ' + String(error))
    }

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
