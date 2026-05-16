/**
 * Scraper: IANT
 * URL: https://timing.athanplus.com/masjid/widgets/embed?theme=1&masjid_id=xdy03lAX
 * Method: GET AthanPlus widget (embedded on iant.com via iframe)
 *         Active carousel slide = today's iqamah times
 */
import axios from 'axios'
import * as cheerio from 'cheerio'
import { logger } from './logger'
import { normalizeTime } from './normalizeTime'
import { upsertPrayerTimes, logScrape, todayDate, TimesOnly } from './database'

const MASJID_NAME = 'IANT'
const WIDGET_URL  = 'https://timing.athanplus.com/masjid/widgets/embed?theme=1&masjid_id=xdy03lAX'
const SOURCE_URL  = 'https://iant.com'

export async function scrapeIANT(): Promise<void> {
  const start = logger.scrapeStart(MASJID_NAME)
  const date  = todayDate()

  try {
    const { data: html } = await axios.get(WIDGET_URL, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IqamaTimeBot/1.0)' },
    })

    const $ = cheerio.load(html as string)

    // The carousel has 7 slides (one per day); find which index is active (today)
    let activeIdx = 0
    $('.carousel-item').each((i, el) => {
      if ($(el).hasClass('active')) activeIdx = i
    })

    // Tables and Jumuah ULs are parallel arrays matching carousel slides
    const table = $('table').eq(activeIdx)

    const times: TimesOnly = {
      fajr: null, dhuhr: null, asr: null, maghrib: null, isha: null,
      jummah1: null, jummah2: null,
    }

    // Each prayer row: td[0]=name, td[1]=adhan, td[2]=iqamah (bold)
    table.find('tr').each((_, row) => {
      const cells = $(row).find('td')
      if (cells.length < 3) return
      const name   = cells.eq(0).text().replace(/\s+/g, ' ').trim().toLowerCase()
      const iqamah = cells.eq(2).find('b').text().trim() || cells.eq(2).text().trim()

      if      (name.includes('fajr'))    times.fajr    = normalizeTime(iqamah)
      else if (name.includes('dhuhr'))   times.dhuhr   = normalizeTime(iqamah)
      else if (name.includes('asr'))     times.asr     = normalizeTime(iqamah)
      else if (name.includes('maghrib')) times.maghrib = normalizeTime(iqamah)
      else if (name.includes('isha'))    times.isha    = normalizeTime(iqamah)
    })

    // Jumuah times: parallel UL list at same index as active carousel slide
    $('ul.month-calendar').eq(activeIdx).find('li').each((_, item) => {
      const time  = $(item).find('b').text().trim()
      const label = $(item).find('p').text().trim().toLowerCase()
      if      (label.includes('1')) times.jummah1 = normalizeTime(time)
      else if (label.includes('2')) times.jummah2 = normalizeTime(time)
    })

    await upsertPrayerTimes({ masjidName: MASJID_NAME, date, sourceUrl: SOURCE_URL, ...times })
    const dur = logger.scrapeEnd(MASJID_NAME, start, true)
    await logScrape(MASJID_NAME, true, dur)
  } catch (err: unknown) {
    const dur = logger.scrapeEnd(MASJID_NAME, start, false)
    const msg = err instanceof Error ? err.message : String(err)
    logger.error(MASJID_NAME, msg)
    await logScrape(MASJID_NAME, false, dur, msg)
  }
}
