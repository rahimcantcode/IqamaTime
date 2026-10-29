/**
 * Scraper: IANT
 * URL: https://timing.athanplus.com/masjid/widgets/embed?theme=1&masjid_id=xdy03lAX
 * Method: GET AthanPlus widget (embedded on iant.com via iframe)
 *         Select the explicit Dallas calendar date, not the provider's active slide
 */
import axios from 'axios'
import { logger } from './logger'
import { parseAthanPlusTimes } from './athanplus'
import { upsertPrayerTimes, logScrape, todayDate } from './database'

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

    const times = parseAthanPlusTimes(html as string, date)

    await upsertPrayerTimes({ masjidName: MASJID_NAME, date, sourceUrl: SOURCE_URL, ...times })
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
