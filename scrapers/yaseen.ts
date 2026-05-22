/**
 * Scraper: Masjid Yaseen
 * URL: https://masjidyaseen.org
 * Method: axios + regex on static HTML
 *   Structure: <h2 class="elementor-heading-title">Fajr</h2>
 *              ...
 *              Iqamah: {time}
 *
 *   Static HTML contains all times server-side rendered via madinaapps plugin.
 *   Playwright is not needed — the site uses Cloudflare which breaks headless browsers.
 */
import axios from 'axios'
import { logger } from './logger'
import { normalizeTime } from './normalizeTime'
import { upsertPrayerTimes, logScrape, todayDate, TimesOnly } from './database'

const MASJID_NAME = 'Masjid Yaseen'
const URL = 'https://masjidyaseen.org'

export async function scrapeYaseen(): Promise<void> {
  const start = logger.scrapeStart(MASJID_NAME)
  const date  = todayDate()

  try {
    const { data: html } = await axios.get(URL, {
      timeout: 20000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IqamaTimeBot/1.0)' },
    })

    const times: TimesOnly = {
      fajr: null, dhuhr: null, asr: null, maghrib: null, isha: null,
      jummah1: null, jummah2: null, jummah3: null,
    }

    // Each prayer block: <h2>PrayerName</h2> ... Iqamah: ... TIME
    // Gaps between headings are ~2200 chars; use 3000 as safe upper bound
    const blockRe = /<h2[^>]*elementor-heading-title[^>]*>([^<]+)<\/h2>([\s\S]{0,3000}?)(?=<h2[^>]*elementor-heading-title|$)/gi
    let m: RegExpExecArray | null

    while ((m = blockRe.exec(html)) !== null) {
      const name  = m[1].trim().toLowerCase().replace(/’/g, "'")
      const block = m[2]

      // The plugin inserts a large <script> block between "Iqamah:" and the time; use 1500 char window
      const iqamahMatch = block.match(/Iqamah[\s\S]{0,1500}?(\d{1,2}:\d{2}\s*(?:AM|PM))/i)
      const iqamahTime  = iqamahMatch?.[1] ?? null

      if (name.includes('fajr'))                              times.fajr    = normalizeTime(iqamahTime)
      if (name.includes('dhuhr') || name.includes('zuhr'))   times.dhuhr   = normalizeTime(iqamahTime)
      if (name.includes('asr'))                              times.asr     = normalizeTime(iqamahTime)
      if (name.includes('maghrib'))                          times.maghrib  = normalizeTime(iqamahTime)
      if (name.includes('isha'))                             times.isha    = normalizeTime(iqamahTime)
      if (name.includes('jumu') || name.includes("jumu'ah")) {
        // madinaapps injects large <script> blocks between label text and the time value.
        // Strip scripts before matching so the window stays small and reliable.
        const cleanBlock = block.replace(/<script[\s\S]*?<\/script>/gi, '')
        const j1 = cleanBlock.match(/1st[^:]*:\s*([\s\S]{0,30}?)(\d{1,2}:\d{2}\s*(?:AM|PM))/i)
        const j2 = cleanBlock.match(/2nd[^:]*:\s*([\s\S]{0,30}?)(\d{1,2}:\d{2}\s*(?:AM|PM))/i)
        if (j1) times.jummah1 = normalizeTime(j1[2])
        if (j2) times.jummah2 = normalizeTime(j2[2])
        if (!times.jummah1 && iqamahTime) times.jummah1 = normalizeTime(iqamahTime)
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
