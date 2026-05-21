/**
 * Scraper: Islamic Center of Rowlett
 * URL: https://icrmasjid.org
 * Method: axios + regex against prayer section markup/text
 */
import axios from 'axios'
import * as cheerio from 'cheerio'
import { logger } from './logger'
import { normalizeTime } from './normalizeTime'
import { upsertPrayerTimes, logScrape, todayDate, TimesOnly } from './database'
import { sunsetPlus } from './sunsetUtils'

const MASJID_NAME = 'Islamic Center of Rowlett'
const URL = 'https://icrmasjid.org'

function stripTags(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

function firstTime(value: string | null | undefined) {
  const match = value?.match(/\d{1,2}:\d{2}\s*(?:AM|PM)/i)?.[0]
  return normalizeTime(match ?? null)
}

function setByName(times: TimesOnly, name: string, raw: string) {
  const label = name.toLowerCase()
  const parsed = firstTime(raw)
  if (!parsed) return

  if (label.includes('fajr')) times.fajr = parsed
  else if (label.includes('dhuhr') || label.includes('duhur') || label.includes('zuhr')) times.dhuhr = parsed
  else if (label.includes('asr') || label.includes('asar')) times.asr = parsed
  else if (label.includes('maghrib')) times.maghrib = parsed
  else if (label.includes('isha')) times.isha = parsed
  else if (label.includes('jumu') || label.includes('jumma') || label.includes('jummah') || label.includes('friday')) {
    if (!times.jummah1) times.jummah1 = parsed
    else times.jummah2 = parsed
  }
}

function parseTimes(html: string): TimesOnly {
  const times: TimesOnly = {
    fajr: null, dhuhr: null, asr: null, maghrib: null, isha: null,
    jummah1: null, jummah2: null,
  }

  // Main ICR layout: Elementor icon-box widgets, h3 span is name and h5 is iqama time.
  const nameTimeRe = /<h3[^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>[\s\S]*?<\/h3>[\s\S]*?<h5[^>]*>([\s\S]*?)<\/h5>/gi
  let m: RegExpExecArray | null
  while ((m = nameTimeRe.exec(html)) !== null) {
    setByName(times, stripTags(m[1]), stripTags(m[2]))
  }

  // Fallback: use plain text if website markup changes.
  const text = stripTags(cheerio.load(html).text())
  const labels = ['Fajr', 'Dhuhr', 'Duhur', 'Zuhr', 'Asr', 'Maghrib', 'Isha', 'Jummah', 'Jumuah', 'Friday']
  for (const label of labels) {
    const match = text.match(new RegExp(`${label}[^0-9]{0,40}(\\d{1,2}:\\d{2}\\s*(?:AM|PM))`, 'i'))
    if (match) setByName(times, label, match[1])
  }

  return times
}

export async function scrapeICR(): Promise<void> {
  const start = logger.scrapeStart(MASJID_NAME)
  const date  = todayDate()

  try {
    const { data: html } = await axios.get(URL, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://www.google.com/',
      },
    })

    const times = parseTimes(html as string)

    // ICR Maghrib iqamah is sunset + 10 min when no fixed time is listed.
    if (!times.maghrib) times.maghrib = await sunsetPlus(10)

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
