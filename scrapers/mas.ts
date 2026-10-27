import axios from 'axios'
import * as cheerio from 'cheerio'
import crypto from 'crypto'
import { logger } from './logger'
import { normalizeTime } from './normalizeTime'
import { ensureMasjid, getSupabase, logScrape, todayDate, TimesOnly, upsertPrayerTimes, ScrapedCommunityEvent } from './database'

const MASJID_NAME = 'MAS Dallas'
const SOURCE_NAME = 'MAS Dallas'
const HOME_URL = 'https://masdfw.org'
const PROGRAMS_URL = 'https://masdfw.org/programs.html?cat=adults'
const LOCATION = 'MAS Dallas, 1515 Blake Dr, Richardson, TX 75081'
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
}

function clean(value: string) { return value.replace(/\s+/g, ' ').trim() }
function eventHash(event: ScrapedCommunityEvent) {
  return crypto.createHash('md5').update([event.title, event.eventTime, event.location, event.sourceUrl].join('|')).digest('hex')
}

export function parseMASAnnualSchedule(script: string, date: string): TimesOnly {
  const year = Number(script.match(/var\s+PT_YEAR\s*=\s*(\d{4})/)?.[1])
  const packed = script.match(/var\s+PT_DATA\s*=\s*"(\d+)"/)?.[1]
  if (!packed || year !== Number(date.slice(0, 4))) throw new Error('MAS annual schedule missing or wrong year')
  const day = Math.floor((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${year}-01-01T12:00:00Z`)) / 86400000)
  const row = packed.slice(day * 44, (day + 1) * 44)
  if (row.length !== 44) throw new Error('MAS schedule has no row for ' + date)
  const time = (column: number) => normalizeTime(row.slice(column * 4, column * 4 + 4))
  const jummah = script.match(/var\s+JUMUAH\s*=\s*"(\d{1,2}:\d{2})"/)?.[1]
  return {
    fajr: time(1), dhuhr: time(4), asr: time(6), maghrib: time(8), isha: time(10),
    jummah1: jummah ? normalizeTime(jummah + ' PM') : null, jummah2: null, jummah3: null,
  }
}

export function parseProgramEvents(html: string): ScrapedCommunityEvent[] {
  const $ = cheerio.load(html)
  const events: ScrapedCommunityEvent[] = []
  $('a.program-item').each((_, el) => {
    const card = $(el)
    const title = clean(card.find('.card__title').text())
    const href = card.attr('href')
    if (!title || !href) return
    const image = card.find('img').attr('src')
    events.push({
      title, eventDate: null, eventTime: clean(card.find('.card__meta').text()) || null,
      location: LOCATION, speakers: null, description: clean(card.find('.card__excerpt').text()) || null,
      imageUrl: image ? new URL(image, HOME_URL).toString() : null,
      sourceUrl: new URL(href, HOME_URL).toString(), sourceName: SOURCE_NAME,
    })
  })
  if (!events.length) throw new Error('MAS program cards not found; preserving previous events')
  return events
}

async function upsertMasEvents(events: ScrapedCommunityEvent[]) {
  if (process.env.SCRAPE_DRY_RUN === '1') return
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
  const { error: cleanupError } = await supabase.from('community_events').update({ active: false })
    .eq('source_name', SOURCE_NAME).or(`content_hash.is.null,content_hash.not.in.(${rows.map(row => row.content_hash).join(',')})`)
  if (cleanupError) throw cleanupError
}

export async function scrapeMAS(): Promise<void> {
  const start = logger.scrapeStart(MASJID_NAME)
  const date = todayDate()
  try {
    await ensureMasjid({ name: MASJID_NAME, city: 'Richardson', websiteUrl: HOME_URL })
    const { data: homeHtml } = await axios.get(HOME_URL, { timeout: 15000, headers: HEADERS })
    const $ = cheerio.load(homeHtml as string)
    const src = $('script[src]').map((_, el) => $(el).attr('src')).get().find(src => /(?:^|\/)assets\/main\.js/.test(src))
    if (!src) throw new Error('MAS annual prayer schedule script missing')
    const scriptUrl = new URL(src, HOME_URL).toString()
    const { data: script } = await axios.get(scriptUrl, { timeout: 15000, headers: HEADERS })
    const times = parseMASAnnualSchedule(script as string, date)
    await upsertPrayerTimes({ masjidName: MASJID_NAME, date, sourceUrl: HOME_URL, ...times })
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

export async function scrapeMASEvents(): Promise<void> {
  const { data: html } = await axios.get(PROGRAMS_URL, { timeout: 20000, headers: HEADERS })
  await upsertMasEvents(parseProgramEvents(html as string))
}
