import axios from 'axios'
import * as cheerio from 'cheerio'
import { logger } from './logger'
import { normalizeTime } from './normalizeTime'
import { ensureMasjid, logScrape, replaceCommunityEventsForSource, todayDate, TimesOnly, upsertPrayerTimes, ScrapedCommunityEvent } from './database'

const MASJID_NAME = 'MAS Dallas'
const SOURCE_NAME = 'MAS Dallas'
const HOME_URL = 'https://masdfw.org'
const PROGRAMS_URL = 'https://masdfw.org/adults/'
const LOCATION = 'MAS Dallas, 1515 Blake Dr, Richardson, TX 75081'
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; IqamaTimeBot/1.0)' }

function clean(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function absoluteUrl(src: string | undefined | null) {
  if (!src) return null
  try { return new URL(src, PROGRAMS_URL).toString() } catch { return null }
}

function parsePrayerTimes(text: string): TimesOnly {
  const times: TimesOnly = { fajr: null, dhuhr: null, asr: null, maghrib: null, isha: null, jummah1: null, jummah2: null }
  const iqamah = text.match(/Iqamah\s+([0-9:APMapm\s]+?)(?:\s+\*|\s+Home|\s+Adults|$)/)?.[1]?.match(/\d{1,2}:\d{2}\s*(?:AM|PM)/gi) ?? []
  const adhaan = text.match(/Adhaan\s+([0-9:APMapm\s]+?)(?:\s+Iqamah|\s+\*)/)?.[1]?.match(/\d{1,2}:\d{2}\s*(?:AM|PM)/gi) ?? []
  times.fajr = normalizeTime(iqamah[0])
  times.dhuhr = normalizeTime(iqamah[1])
  times.asr = normalizeTime(iqamah[2])
  times.maghrib = normalizeTime(iqamah[3])
  times.isha = normalizeTime(iqamah[4])
  times.jummah1 = normalizeTime(adhaan[5])
  return times
}

function collectTextAfter($: cheerio.CheerioAPI, heading: cheerio.Element) {
  const parts: string[] = []
  let node = $(heading).next()
  while (node.length) {
    const tag = node.get(0)?.tagName?.toLowerCase()
    if (tag && /^h[1-3]$/.test(tag)) break
    const text = clean(node.text())
    if (text) parts.push(text)
    node = node.next()
  }
  return parts.join(' ')
}

function nearbyImage($: cheerio.CheerioAPI, heading: cheerio.Element) {
  const img = $(heading).prevAll('img').first().length ? $(heading).prevAll('img').first() : $(heading).parent().find('img').first()
  return absoluteUrl(img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src'))
}

function parseProgramEvents(html: string): ScrapedCommunityEvent[] {
  const $ = cheerio.load(html)
  const meta: Record<string, { title: string; time: string | null; speakers: string | null }> = {
    'live, learn, love': { title: 'Live, Learn, Love', time: null, speakers: null },
    'finjan qahwa (book club)': { title: 'Finjan Qahwa Book Club', time: null, speakers: null },
    'quran circles for brothers': { title: 'Quran Circles for Brothers', time: 'Thursdays', speakers: 'Imam Dr. Ahmed Rashad' },
    'qur’an institute (ladies)': { title: 'Qur’an Institute for Ladies', time: 'Tuesdays, Thursdays, and Saturdays', speakers: null },
    "qur'an institute (ladies)": { title: 'Qur’an Institute for Ladies', time: 'Tuesdays, Thursdays, and Saturdays', speakers: null },
  }
  const events: ScrapedCommunityEvent[] = []
  $('h2').each((_, heading) => {
    const key = clean($(heading).text()).toLowerCase()
    const item = meta[key]
    if (!item) return
    const description = collectTextAfter($, heading).replace(/To learn more, please contact the program staff at:.*/i, 'Tap here to view full event details.').trim() || 'Tap here to view full event details.'
    events.push({ title: item.title, eventDate: null, eventTime: item.time, location: LOCATION, speakers: item.speakers, description, imageUrl: nearbyImage($, heading), sourceUrl: PROGRAMS_URL, sourceName: SOURCE_NAME })
  })
  return events
}

export async function scrapeMAS(): Promise<void> {
  const start = logger.scrapeStart(MASJID_NAME)
  const date = todayDate()
  try {
    await ensureMasjid({ name: MASJID_NAME, city: 'Richardson', websiteUrl: HOME_URL })
    const [{ data: homeHtml }, { data: programsHtml }] = await Promise.all([
      axios.get(HOME_URL, { timeout: 15000, headers: HEADERS }),
      axios.get(PROGRAMS_URL, { timeout: 15000, headers: HEADERS }),
    ])
    const times = parsePrayerTimes(clean(cheerio.load(homeHtml as string).text()))
    await upsertPrayerTimes({ masjidName: MASJID_NAME, date, sourceUrl: HOME_URL, ...times })
    await replaceCommunityEventsForSource({ masjidName: MASJID_NAME, sourceName: SOURCE_NAME, events: parseProgramEvents(programsHtml as string) })
    const dur = logger.scrapeEnd(MASJID_NAME, start, true)
    await logScrape(MASJID_NAME, true, dur)
  } catch (err: unknown) {
    const dur = logger.scrapeEnd(MASJID_NAME, start, false)
    const msg = err instanceof Error ? err.message : String(err)
    logger.error(MASJID_NAME, msg)
    await logScrape(MASJID_NAME, false, dur, msg)
  }
}
