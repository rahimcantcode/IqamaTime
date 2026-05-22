/**
 * Scraper: McKinney Islamic Association
 * URL: https://us.mohid.co/tx/dallas/mia
 * Method: axios + cheerio (old Mohid platform, SSR HTML)
 * Daily: div.list.plusG li — prayer name in first text node, iqama in .prayer_iqama_div
 * Jummah: items with "Friday Khutba" text, time in .num element
 */
import axios from 'axios'
import * as cheerio from 'cheerio'
import { logger } from './logger'
import { normalizeTime } from './normalizeTime'
import { upsertPrayerTimes, logScrape, todayDate, TimesOnly } from './database'

const MASJID_NAME = 'McKinney Islamic Association'
const URL = 'https://us.mohid.co/tx/dallas/mia'

export async function scrapeMIA(): Promise<void> {
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

    // Daily prayer iqama times
    $('div.list.plusG li').each((_, li) => {
      const text = $(li).text().toLowerCase()
      const iqamaText = $(li).find('.prayer_iqama_div').text().trim()
      const iqama = iqamaText || $(li).find('.num').last().text().trim() || null

      if (text.includes('fajr'))                                 times.fajr    = normalizeTime(iqama)
      else if (text.includes('dhuhr') || text.includes('zuhr')) times.dhuhr   = normalizeTime(iqama)
      else if (text.includes('asr'))                            times.asr     = normalizeTime(iqama)
      else if (text.includes('maghrib'))                        times.maghrib  = normalizeTime(iqama)
      else if (text.includes('isha'))                           times.isha    = normalizeTime(iqama)
    })

    // Jummah times — "Friday Khutba 1/2/3" items with .num containing the time
    $('li, div, p').each((_, el) => {
      const text = $(el).text().toLowerCase()
      if (!text.includes('friday') && !text.includes('khutba') && !text.includes('jumu')) return
      const timeText = $(el).find('.num').text().trim()
      if (!timeText) return
      const t = normalizeTime(timeText)
      if      (!times.jummah1) times.jummah1 = t
      else if (!times.jummah2 && t !== times.jummah1) times.jummah2 = t
      else if (!times.jummah3 && t !== times.jummah2) times.jummah3 = t
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
