import axios from 'axios'
import * as cheerio from 'cheerio'
import crypto from 'crypto'
import { logger } from './logger'
import { normalizeTime } from './normalizeTime'
import { ensureMasjid, getSupabase, logScrape, todayDate, TimesOnly, upsertPrayerTimes, ScrapedCommunityEvent } from './database'

const MASJID_NAME = 'MAS Dallas'
const SOURCE_NAME = 'MAS Dallas'
const HOME_URL = 'https://masdfw.org'
const PROGRAMS_URL = 'https://masdfw.org/adults/'
const LOCATION = 'MAS Dallas, 1515 Blake Dr, Richardson, TX 75081'
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; IqamaTimeBot/1.0)' }

function clean(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function eventHash(event: ScrapedCommunityEvent) {
  return crypto.createHash('sha256').update([
    event.sourceName,
    event.sourceUrl,
    event.title,
    event.eventTime ?? '',
    event.location ?? '',
  ].join('|')).digest('hex')
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

function fallbackEvents(): ScrapedCommunityEvent[] {
  return [
    { title: 'Live, Learn, Love', eventDate: null, eventTime: 'Weekly sisters class', location: LOCATION, speakers: null, description: 'Weekly class for sisters of all ages at MAS Dallas. Tap here to view full event details.', imageUrl: null, sourceUrl: PROGRAMS_URL, sourceName: SOURCE_NAME },
    { title: 'Finjan Qahwa Book Club', eventDate: null, eventTime: 'Recurring program', location: LOCATION, speakers: null, description: 'A community book club and gathering. Tap here to view full event details.', imageUrl: null, sourceUrl: PROGRAMS_URL, sourceName: SOURCE_NAME },
    { title: 'Quran Circles for Brothers', eventDate: null, eventTime: 'Thursdays', location: LOCATION, speakers: 'Imam Dr. Ahmed Rashad', description: 'Weekly Quran recitation and tajweed halaqa for brothers. Tap here to view full event details.', imageUrl: null, sourceUrl: PROGRAMS_URL, sourceName: SOURCE_NAME },
    { title: 'Qur’an Institute for Ladies', eventDate: null, eventTime: 'Tuesdays, Thursdays, and Saturdays', location: LOCATION, speakers: null, description: 'Ladies program for learning Quran recitation, Tajweed, memorization, and certification. Tap here to view full event details.', imageUrl: null, sourceUrl: PROGRAMS_URL, sourceName: SOURCE_NAME },
  ]
}

function parseProgramEvents(html: string): ScrapedCommunityEvent[] {
  const $ = cheerio.load(html)
  const meta: Record<string, { title: string; time: string | null; speakers: string | null }> = {
    'live, learn, love': { title: 'Live, Learn, Love', time: 'Weekly sisters class', speakers: null },
    'finjan qahwa (book club)': { title: 'Finjan Qahwa Book Club', time: 'Recurring program', speakers: null },
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
  return events.length ? events : fallbackEvents()
}

async function upsertMasEvents(events: ScrapedCommunityEvent[]) {
  const supabase = getSupabase()
  const masjidId = await ensureMasjid({ name: MASJID_NAME, city: 'Richardson', websiteUrl: HOME_URL })
  if (!masjidId || !events.length) return

  const rows = events.map(event => ({
    masjid_id: masjidId,
    title: event.title,
    event_date: event.eventDate,
    event_time: event.eventTime,
    location: event.location,
    speakers: event.speakers,
    description: event.description,
    image_url: event.imageUrl,
    source_url: event.sourceUrl,
    source_name: event.sourceName,
    content_hash: eventHash(event),
    scraped_at: new Date().toISOString(),
    active: true,
  }))

  const { error } = await supabase.from('community_events').upsert(rows, { onConflict: 'content_hash' })
  if (error) throw error
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
    await upsertMasEvents(parseProgramEvents(programsHtml as string))
    const dur = logger.scrapeEnd(MASJID_NAME, start, true)
    await logScrape(MASJID_NAME, true, dur)
  } catch (err: unknown) {
    const dur = logger.scrapeEnd(MASJID_NAME, start, false)
    const msg = err instanceof Error ? err.message : String(err)
    logger.error(MASJID_NAME, msg)
    await logScrape(MASJID_NAME, false, dur, msg)
  }
}
