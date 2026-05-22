/**
 * Scraper: Islamic Center of Frisco
 * URL: https://friscomasjid.org → iframe at widgets.madinaapps.com (Angular SPA)
 * Method: Playwright — renders Angular SPA to extract prayer times
 */
import { logger } from './logger'
import { normalizeTime } from './normalizeTime'
import { upsertPrayerTimes, logScrape, todayDate, TimesOnly } from './database'
import { launchBrowser } from './browser'

const MASJID_NAME = 'Islamic Center of Frisco'
const PAGE_URL    = 'https://friscomasjid.org/prayertimes'
const WIDGET_URL  = 'https://widgets.madinaapps.com/friscomasjid/prayertime'

export async function scrapeFrisco(): Promise<void> {
  const start = logger.scrapeStart(MASJID_NAME)
  const date  = todayDate()

  try {
    const browser = await launchBrowser()
    const page    = await browser.newPage()

    await page.goto(WIDGET_URL, { waitUntil: 'networkidle', timeout: 45000 })

    await page.waitForSelector(
      'tr, [class*="salah"], [class*="prayer"], [class*="iqama"]',
      { timeout: 20000 }
    ).catch(() => {})

    const html = await page.content()
    await browser.close()

    const { load } = await import('cheerio')
    const $ = load(html)
    const times: TimesOnly = {
      fajr: null, dhuhr: null, asr: null, maghrib: null, isha: null,
      jummah1: null, jummah2: null, jummah3: null,
    }

    $('tr, [class*="salah-row"], [class*="prayer-row"]').each((_, el) => {
      const text  = $(el).text().toLowerCase()
      const cells = $(el).find('td, span, div').map((_, c) => $(c).text().trim()).get()
      const timeCells = cells.filter(c => /\d{1,2}:\d{2}\s*(?:AM|PM)/i.test(c))

      if (text.includes('jumu') || text.includes('jumma') || text.includes('friday')) {
        const t = normalizeTime(timeCells[0] ?? null)
        if (!t) return
        if      (!times.jummah1) times.jummah1 = t
        else if (!times.jummah2 && t !== times.jummah1) times.jummah2 = t
        else if (!times.jummah3 && t !== times.jummah2) times.jummah3 = t
        return
      }

      const iqama = timeCells[timeCells.length - 1] ?? null
      if (text.includes('fajr'))                           times.fajr    = normalizeTime(iqama)
      if (text.includes('dhuhr') || text.includes('zuhr')) times.dhuhr   = normalizeTime(iqama)
      if (text.includes('asr'))                            times.asr     = normalizeTime(iqama)
      if (text.includes('maghrib'))                        times.maghrib  = normalizeTime(iqama)
      if (text.includes('isha'))                           times.isha    = normalizeTime(iqama)
    })

    await upsertPrayerTimes({ masjidName: MASJID_NAME, date, sourceUrl: PAGE_URL, ...times })
    const dur = logger.scrapeEnd(MASJID_NAME, start, true)
    await logScrape(MASJID_NAME, true, dur)
  } catch (err: unknown) {
    const dur = logger.scrapeEnd(MASJID_NAME, start, false)
    const msg = err instanceof Error ? err.message : String(err)
    logger.error(MASJID_NAME, msg)
    await logScrape(MASJID_NAME, false, dur, msg)
  }
}
