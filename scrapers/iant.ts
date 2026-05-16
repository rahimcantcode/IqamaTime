/**
 * Scraper: IANT
 * URL: https://iant.com
 * Method: POST to WP admin-ajax.php with action=get_monthly_timetable
 *         Parse HTML table — iqamah columns at fixed indices
 */
import axios from 'axios'
import * as cheerio from 'cheerio'
import { logger } from './logger'
import { normalizeTime } from './normalizeTime'
import { upsertPrayerTimes, logScrape, todayDate, TimesOnly } from './database'

const MASJID_NAME = 'IANT'
const AJAX_URL    = 'https://iant.com/wp-admin/admin-ajax.php'
const SOURCE_URL  = 'https://iant.com'

export async function scrapeIANT(): Promise<void> {
  const start = logger.scrapeStart(MASJID_NAME)
  const date  = todayDate()

  try {
    const now   = new Date()
    const month = now.getMonth() + 1
    const year  = now.getFullYear()

    const { data: html } = await axios.post(
      AJAX_URL,
      new URLSearchParams({ action: 'get_monthly_timetable', month: String(month), year: String(year) }),
      {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; IqamaTimeBot/1.0)',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )

    const $ = cheerio.load(html as string)

    // Table columns (0-indexed):
    // 0=Date, 1=Day, 2=Fajr SuhoorEnd, 3=Fajr Iqamah, 4=Sunrise,
    // 5=Zuhr Begins, 6=Zuhr Iqamah, 7=Asr Begins, 8=Asr Iqamah,
    // 9=Maghrib Iftar, 10=Maghrib Iqamah, 11=Isha Begins, 12=Isha Iqamah
    const IQAMAH_COLS = { fajr: 3, dhuhr: 6, asr: 8, maghrib: 10, isha: 12 }

    const todayLabel = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const times: TimesOnly = {
      fajr: null, dhuhr: null, asr: null, maghrib: null, isha: null,
      jummah1: null, jummah2: null,
    }

    $('tr').each((_, row) => {
      const cells = $(row).find('td').map((_, c) => $(c).text().trim()).get()
      if (cells.length < 13) return

      // Match "May 15, 2026 " (plugin adds trailing space)
      if (!cells[0].trim().startsWith(todayLabel.replace(',', ',').split(',')[0])) return
      // Confirm day matches more loosely (month + day number)
      const cellDate = cells[0].trim()
      const expectedPrefix = `${now.toLocaleString('en-US', { month: 'long' })} ${now.getDate()},`
      if (!cellDate.startsWith(expectedPrefix)) return

      for (const [prayer, col] of Object.entries(IQAMAH_COLS)) {
        (times as Record<string, string | null>)[prayer] = normalizeTime(cells[col] ?? null)
      }
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
