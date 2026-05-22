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
import { launchBrowser } from './browser'

const MASJID_NAME = 'American Imams Academy'
const URL = 'https://themasjidapp.org/129401/prayers'

export async function scrapeAIA(): Promise<void> {
  const start = logger.scrapeStart(MASJID_NAME)
  const date  = todayDate()

  try {
    const browser = await launchBrowser()
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
      jummah1: null, jummah2: null, jummah3: null,
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
    })

    // Jummah: parse from __NEXT_DATA__ events (isJuma:true) — more reliable than
    // the merged table cell which contains multiple times concatenated with Arabic text.
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>(\{[\s\S]*?\})<\/script>/)
    if (nextDataMatch) {
      try {
        const nextData = JSON.parse(nextDataMatch[1])
        const events: Array<{ timeDesc?: string; isJuma?: boolean }> =
          nextData?.props?.pageProps?.masjid?.events ?? []
        for (const ev of events) {
          if (!ev.isJuma || !ev.timeDesc) continue
          const t = normalizeTime(ev.timeDesc.replace(/\s*(am|pm)/i, ' $1').trim())
          if      (!times.jummah1) times.jummah1 = t
          else if (!times.jummah2) times.jummah2 = t
          else if (!times.jummah3) times.jummah3 = t
        }
      } catch {
        // __NEXT_DATA__ parse failed — jummah times stay null
      }
    }

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
