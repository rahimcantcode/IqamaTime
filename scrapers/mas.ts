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
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
}

type CheerioNode = Parameters<cheerio.CheerioAPI>[0]

const EVENT_IMAGE_FALLBACKS: Record<string, string> = {
  'Live, Learn, Love': 'https://masdfw.org/wp-content/uploads/2024/12/WednesdayTafseerHalaqa2024EamanAttia-e1736198216424.jpeg',
  'Finjan Qahwa Book Club': 'https://masdfw.org/wp-content/uploads/2023/09/Finjan-Qahwa1.png',
  'Quran Circles for Brothers': 'https://masdfw.org/wp-content/uploads/2023/09/Brothers-Quran-Circles.png',
  'Qur’an Institute for Ladies': 'https://masdfw.org/wp-content/uploads/2023/09/quran-institute.jpeg',
}

function clean(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function eventHash(event: ScrapedCommunityEvent) {
  return crypto.createHash('md5').update([
    event.title ?? '',
    event.eventTime ?? '',
    event.location ?? '',
    event.sourceUrl ?? '',
  ].join('|')).digest('hex')
}

function absoluteUrl(src: string | undefined | null, base = PROGRAMS_URL) {
  if (!src) return null
  const firstSrc = src.split(',')[0]?.trim().split(' ')[0]
  if (!firstSrc) return null
  try { return new URL(firstSrc, base).toString() } catch { return null }
}

function imageFromElement($: cheerio.CheerioAPI, element: cheerio.Cheerio<any>) {
  const img = element.is('img') ? element : element.find('img').first()
  const directSrc =
    img.attr('src') ||
    img.attr('data-src') ||
    img.attr('data-lazy-src') ||
    img.attr('data-original') ||
    img.attr('data-orig-file') ||
    img.attr('srcset') ||
    img.attr('data-srcset')

  const directUrl = absoluteUrl(directSrc)
  if (directUrl) return directUrl

  const style = element.attr('style') || element.find('[style*="background-image"]').first().attr('style')
  const styleMatch = style?.match(/url\(["']?([^"')]+)["']?\)/i)
  return absoluteUrl(styleMatch?.[1])
}

function parsePrayerTimes(html: string): TimesOnly {
  const times: TimesOnly = { fajr: null, dhuhr: null, asr: null, maghrib: null, isha: null, jummah1: null, jummah2: null, jummah3: null }

  // WordPress madinaapps plugin injects <script> blocks inside each <td>, corrupting plain text extraction.
  // Strip all script tags first, then traverse the table DOM directly.
  const cleanHtml = html.replace(/<script[\s\S]*?<\/script>/gi, '')
  const $ = cheerio.load(cleanHtml)

  let iqamahCells: (string | null)[] = []
  let adhaanCells: (string | null)[] = []

  $('table').first().find('tr').each((_, row) => {
    const cells: string[] = []
    $(row).find('td, th').each((_, cell) => {
      cells.push(clean($(cell).text()))
    })
    if (!cells.length) return
    const label = cells[0].toLowerCase()
    const extracted = cells.slice(1).map(c => c.match(/\d{1,2}:\d{2}\s*(?:AM|PM)/i)?.[0] ?? null)
    if (label.includes('iqamah')) iqamahCells = extracted
    if (label.includes('adhaan') || label.includes('adhan')) adhaanCells = extracted
  })

  times.fajr    = normalizeTime(iqamahCells[0] ?? null)
  times.dhuhr   = normalizeTime(iqamahCells[1] ?? null)
  times.asr     = normalizeTime(iqamahCells[2] ?? null)
  times.maghrib = normalizeTime(iqamahCells[3] ?? null)
  times.isha    = normalizeTime(iqamahCells[4] ?? null)
  times.jummah1 = normalizeTime(adhaanCells[5] ?? null)

  return times
}

function collectTextAfter($: cheerio.CheerioAPI, heading: CheerioNode) {
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

function collectImagesBeforeHeadings($: cheerio.CheerioAPI) {
  const imagesByHeading = new Map<string, string>()
  let lastImage: string | null = null

  $('body').find('img, [style*="background-image"], h2').each((_, element) => {
    const node = $(element)
    const tag = element.tagName?.toLowerCase()

    if (tag === 'h2') {
      const title = clean(node.text()).toLowerCase()
      if (lastImage && title) imagesByHeading.set(title, lastImage)
      return
    }

    const imageUrl = imageFromElement($, node)
    if (imageUrl && !/logo|icon|facebook|twitter|youtube|instagram|muhsen|apple|google-play/i.test(imageUrl)) {
      lastImage = imageUrl
    }
  })

  return imagesByHeading
}

function fallbackEvents(): ScrapedCommunityEvent[] {
  return [
    { title: 'Live, Learn, Love', eventDate: null, eventTime: 'Weekly sisters class', location: LOCATION, speakers: null, description: 'Weekly class for sisters of all ages at MAS Dallas. Tap here to view full event details.', imageUrl: EVENT_IMAGE_FALLBACKS['Live, Learn, Love'], sourceUrl: PROGRAMS_URL, sourceName: SOURCE_NAME },
    { title: 'Finjan Qahwa Book Club', eventDate: null, eventTime: 'Recurring program', location: LOCATION, speakers: null, description: 'A community book club and gathering. Tap here to view full event details.', imageUrl: EVENT_IMAGE_FALLBACKS['Finjan Qahwa Book Club'], sourceUrl: PROGRAMS_URL, sourceName: SOURCE_NAME },
    { title: 'Quran Circles for Brothers', eventDate: null, eventTime: 'Thursdays', location: LOCATION, speakers: 'Imam Dr. Ahmed Rashad', description: 'Weekly Quran recitation and tajweed halaqa for brothers. Tap here to view full event details.', imageUrl: EVENT_IMAGE_FALLBACKS['Quran Circles for Brothers'], sourceUrl: PROGRAMS_URL, sourceName: SOURCE_NAME },
    { title: 'Qur’an Institute for Ladies', eventDate: null, eventTime: 'Tuesdays, Thursdays, and Saturdays', location: LOCATION, speakers: null, description: 'Ladies program for learning Quran recitation, Tajweed, memorization, and certification. Tap here to view full event details.', imageUrl: EVENT_IMAGE_FALLBACKS['Qur’an Institute for Ladies'], sourceUrl: PROGRAMS_URL, sourceName: SOURCE_NAME },
  ]
}

function parseProgramEvents(html: string): ScrapedCommunityEvent[] {
  const $ = cheerio.load(html)
  const imagesByHeading = collectImagesBeforeHeadings($)
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
    const imageUrl = imagesByHeading.get(key) || EVENT_IMAGE_FALLBACKS[item.title] || null
    events.push({ title: item.title, eventDate: null, eventTime: item.time, location: LOCATION, speakers: item.speakers, description, imageUrl, sourceUrl: PROGRAMS_URL, sourceName: SOURCE_NAME })
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
    image_url: event.imageUrl || EVENT_IMAGE_FALLBACKS[event.title] || null,
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
    const times = parsePrayerTimes(homeHtml as string)
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
