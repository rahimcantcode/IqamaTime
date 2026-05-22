/**
 * Scraper: SMS Masjid of Sachse
 * URL: https://sachsemasjid.org
 * Method: Extract embedded `var mn = {...}` JSON → prayerTimes[0].*.iqamahTime
 */
import axios from 'axios'
import { logger } from './logger'
import { normalizeTime } from './normalizeTime'
import { upsertPrayerTimes, logScrape, todayDate, TimesOnly } from './database'

const MASJID_NAME = 'SMS Masjid of Sachse'
const URL = 'https://sachsemasjid.org'

interface MnPrayerEntry {
  adhaanTime?: string
  iqamahTime?: string
}
interface MnJumaEntry {
  khutbaTime?: string
  iqamahTime?: string
}
interface MnDay {
  fajr?:    MnPrayerEntry
  dhuhr?:   MnPrayerEntry
  asr?:     MnPrayerEntry
  maghrib?: MnPrayerEntry
  isha?:    MnPrayerEntry
  jumaTimes?: MnJumaEntry[]
}
interface MnData {
  prayerTimes?: MnDay[]
}

export async function scrapeSMS(): Promise<void> {
  const start = logger.scrapeStart(MASJID_NAME)
  const date  = todayDate()

  try {
    const { data: html } = await axios.get(URL, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IqamaTimeBot/1.0)' },
    })

    // Extract `var mn = {...};` — the madinaapps prayer widget data
    const mnMatch = (html as string).match(/var\s+mn\s*=\s*(\{[\s\S]*?\});\s*\n/)
    if (!mnMatch) throw new Error('mn variable not found in page')

    const mn = JSON.parse(mnMatch[1]) as MnData
    const today = mn.prayerTimes?.[0]
    if (!today) throw new Error('prayerTimes[0] missing from mn data')

    const times: TimesOnly = {
      fajr:    normalizeTime(today.fajr?.iqamahTime    ?? null),
      dhuhr:   normalizeTime(today.dhuhr?.iqamahTime   ?? null),
      asr:     normalizeTime(today.asr?.iqamahTime     ?? null),
      maghrib: normalizeTime(today.maghrib?.iqamahTime ?? null),
      isha:    normalizeTime(today.isha?.iqamahTime    ?? null),
      jummah1: normalizeTime(today.jumaTimes?.[0]?.khutbaTime ?? null),
      jummah2: normalizeTime(today.jumaTimes?.[1]?.khutbaTime ?? null),
      jummah3: normalizeTime(today.jumaTimes?.[2]?.khutbaTime ?? null),
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
