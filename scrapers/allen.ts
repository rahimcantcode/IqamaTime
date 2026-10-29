/**
 * Scraper: Islamic Association of Allen
 * URL: https://allenmasjid.com
 * Method: axios + cheerio (Mohid Elementor SSR table)
 * Table: 4 columns — icon | prayer-label | adhan (p.btn) | iqama (p.btn)
 * Jummah rows: "Khutbah 1/2" label — time in first p.btn (no separate iqama col)
 */
import axios from 'axios'
import * as cheerio from 'cheerio'
import { logger } from './logger'
import { addFridayTime } from './prayer-source-utils'
import { normalizeTime } from './normalizeTime'
import { upsertPrayerTimes, logScrape, todayDate, TimesOnly } from './database'
import { sunsetPlus } from './sunsetUtils'

const MASJID_NAME = 'Islamic Association of Allen'
const URL = 'https://allenmasjid.com'


export async function parseAllenTimes(html: string, date: string, resolveSunset = sunsetPlus): Promise<TimesOnly> {
  const $ = cheerio.load(html)
  let maghribRelative = false
  const times: TimesOnly = {
    fajr: null, dhuhr: null, asr: null, maghrib: null, isha: null,
    jummah1: null, jummah2: null, jummah3: null,
  }

  $('table tr').each((_, row) => {
    const label = $(row).find('p.prayer-label').text().toLowerCase().trim()
    if (!label) return

    const btns = $(row).find('p.btn').map((_, el) => $(el).text().trim()).get()

    if (label.includes('khutbah') || label.includes('jumu') || label.includes('jumma')) {
      addFridayTime(times, btns[0])
      return
    }

    // iqama is in the 2nd p.btn (index 1); adhan is index 0
    const adhan = btns[0] ?? null
    const iqama = btns[1] ?? null
    if (label.includes('maghrib')) maghribRelative = /sunset/i.test(adhan ?? '') && /^after\s+5\s+mins?$/i.test(iqama?.trim() ?? '')

    if (label.includes('fajr'))                                                    times.fajr    = normalizeTime(iqama)
    if (label.includes('duhr') || label.includes('dhuhr') || label.includes('duhar') || label.includes('zuhr')) times.dhuhr   = normalizeTime(iqama)
    if (label.includes('asr'))                                                     times.asr     = normalizeTime(iqama)
    if (label.includes('maghrib'))                                                 times.maghrib  = normalizeTime(iqama)
    if (label.includes('isha'))                                                    times.isha    = normalizeTime(iqama)
  })

  if (!times.maghrib && maghribRelative) times.maghrib = await resolveSunset(5, { city: 'Allen', date })

  return times
}

export async function scrapeAllen(): Promise<void> {
  const start = logger.scrapeStart(MASJID_NAME)
  const date  = todayDate()

  try {
    const { data: html } = await axios.get(URL, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IqamaTimeBot/1.0)' },
    })

    const times = await parseAllenTimes(html as string, date)

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
