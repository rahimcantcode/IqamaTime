/**
 * Scraper: Valley Ranch Islamic Center
 * URL: https://vric.org/prayertimes → iframe at portal.masjidapps.com (Angular SPA)
 * Method: Playwright — renders the Angular SPA to extract prayer times
 */
import { logger } from './logger'
import { normalizeTime } from './normalizeTime'
import { upsertPrayerTimes, logScrape, todayDate, TimesOnly } from './database'
import { launchBrowser } from './browser'

const MASJID_NAME = 'Valley Ranch Islamic Center'
const PAGE_URL    = 'https://vric.org/prayertimes'
const IFRAME_URL  = 'https://portal.masjidapps.com/public/readOnlySalahTimes?id=MQ2&code=NzY1ZjcxZmQtZjE0NS00OGFjLTljYTgtMjBiYmRlYjdkZGRj0'

export async function scrapeVRIC(): Promise<void> {
  const start = logger.scrapeStart(MASJID_NAME)
  const date  = todayDate()

  try {
    const browser = await launchBrowser()
    const page    = await browser.newPage()

    // Navigate directly to the iframe SPA
    await page.goto(IFRAME_URL, { waitUntil: 'networkidle', timeout: 45000 })

    // Wait for the Angular app to render prayer time rows
    await page.waitForSelector(
      '[ng-repeat], [class*="salah"], [class*="prayer"], [class*="iqamah"], tr',
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

    // MasjidApps table: Prayer Name | Adhan | Iqamah
    // Daily prayers: take last time (iqamah); Jummah: take first time (adhan/khutbah)
    $('tr, [class*="salah-row"], [class*="prayer-row"]').each((_, el) => {
      const text  = $(el).text().toLowerCase()
      const cells = $(el).find('td, span, div').map((_, c) => $(c).text().trim()).get()
      const timeCells = cells.filter(c => /\d{1,2}:\d{2}\s*(?:AM|PM)/i.test(c))

      if (text.includes('jumu') || text.includes('jumma')) {
        const khutbahTime = timeCells[0] ?? null
        if      (!times.jummah1) times.jummah1 = normalizeTime(khutbahTime)
        else if (!times.jummah2) times.jummah2 = normalizeTime(khutbahTime)
        else if (!times.jummah3) times.jummah3 = normalizeTime(khutbahTime)
        return
      }

      const iqamaTime = timeCells[timeCells.length - 1] ?? null
      if (text.includes('fajr'))                           times.fajr    = normalizeTime(iqamaTime)
      if (text.includes('dhuhr') || text.includes('zuhr')) times.dhuhr   = normalizeTime(iqamaTime)
      if (text.includes('asr'))                            times.asr     = normalizeTime(iqamaTime)
      if (text.includes('maghrib'))                        times.maghrib  = normalizeTime(iqamaTime)
      if (text.includes('isha'))                           times.isha    = normalizeTime(iqamaTime)
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
