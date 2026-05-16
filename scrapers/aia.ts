/**
 * Scraper: American Imams Academy
 * URL: https://themasjidapp.org/129401/prayers (embedded iframe on imamsacademy.org)
 * Method: Playwright — themasjidapp.org is a Next.js app that SSR's stale times;
 *   client-side JS fetches live data. Axios only sees the SSR snapshot (wrong times).
 *   Table structure after hydration: Prayer Name (col 0) | Begins (col 1) | Iqama (col 2)
 */
import { logger } from './logger'
import { normalizeTime } from './normalizeTime'
import { upsertPrayerTimes, logScrape, todayDate, TimesOnly } from './database'

const MASJID_NAME = 'American Imams Academy'
const URL = 'https://themasjidapp.org/129401/prayers'

export async function scrapeAIA(): Promise<void> {
  const start = logger.scrapeStart(MASJID_NAME)
  const date  = todayDate()

  try {
    const { chromium } = await import('playwright')
    const browser = await chromium.launch({ headless: true })
    const page    = await browser.newPage()

    await page.goto(URL, { waitUntil: 'networkidle', timeout: 45000 })

    // Wait for the table to be populated by client-side JS
    await page.waitForSelector('tbody tr', { timeout: 15000 }).catch(() => {})

    const html = await page.content()
    await browser.close()

    const { load } = await import('cheerio')
    const $ = load(html)
    const times: TimesOnly = {
      fajr: null, dhuhr: null, asr: null, maghrib: null, isha: null,
      jummah1: null, jummah2: null,
    }

    // Table: Prayer Name (col 0) | Begins/Adhan (col 1) | Iqama (col 2)
    $('tbody tr').each((_, row) => {
      const cells = $(row).find('td').map((_, c) => $(c).text().trim()).get()
      if (cells.length < 2) return

      const name  = cells[0].replace(/[^\x20-\x7E]/g, '').trim().toLowerCase()
      const iqama = cells[2] ?? cells[1]

      if (name.includes('fajr'))                               times.fajr    = normalizeTime(iqama)
      if (name.includes('dhuhr') || name.includes('zuhr'))     times.dhuhr   = normalizeTime(iqama)
      if (name.includes('asr'))                                times.asr     = normalizeTime(iqama)
      if (name.includes('maghrib'))                            times.maghrib  = normalizeTime(iqama)
      if (name.includes('isha'))                               times.isha    = normalizeTime(iqama)
      if (name.includes('jumu') || name.includes('jumua') || name.includes('friday')) {
        const jumTimes = (cells[1] ?? '').split(/,|\n/).map(t => t.trim()).filter(t => /\d/.test(t))
        times.jummah1 = normalizeTime(jumTimes[0] ?? null)
        times.jummah2 = normalizeTime(jumTimes[1] ?? null)
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
