#!/usr/bin/env node
import { config } from 'dotenv'
config({ path: '.env.local' })

import axios from 'axios'
import * as cheerio from 'cheerio'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import type { WebSocketLikeConstructor } from '@supabase/realtime-js'
import WebSocket from 'ws'
import { logger } from './logger'

type EventSource = string

interface SourceDef {
  name: EventSource
  url: string
  forcedMasjidName?: string
}

interface RawEvent {
  title: string
  eventDate: string | null
  eventTime: string | null
  location: string | null
  speakers: string | null
  description: string | null
  imageUrl: string | null
  sourceUrl: string
  sourceName: EventSource
  matchedMasjidName: string
}

const SOURCES: SourceDef[] = [
  { name: 'SalamDFW', url: 'https://salamdfw.com' },
  { name: 'Hilalz Dallas', url: 'https://dallas.hilalz.com' },
  { name: 'Islamic Center of Rowlett', url: 'https://icrmasjid.org', forcedMasjidName: 'Islamic Center of Rowlett' },
  { name: 'EPIC Masjid', url: 'https://epicmasjid.org', forcedMasjidName: 'EPIC Masjid' },
  { name: 'American Imams Academy', url: 'https://imamsacademy.org', forcedMasjidName: 'American Imams Academy' },
  { name: 'SMS Masjid of Sachse', url: 'https://sachsemasjid.org', forcedMasjidName: 'SMS Masjid of Sachse' },
  { name: 'Valley Ranch Islamic Center', url: 'https://vric.org', forcedMasjidName: 'Valley Ranch Islamic Center' },
  { name: 'Qalam Institute', url: 'https://qalamcampus.org', forcedMasjidName: 'Qalam Institute' },
  { name: 'Islamic Association of Collin County', url: 'https://planomasjid.org', forcedMasjidName: 'Islamic Association of Collin County' },
  { name: 'Masjid Yaseen', url: 'https://masjidyaseen.org', forcedMasjidName: 'Masjid Yaseen' },
  { name: 'IANT', url: 'https://iant.com', forcedMasjidName: 'IANT' },
  { name: 'Islamic Center of Irving', url: 'https://www.irvingmasjid.org', forcedMasjidName: 'Islamic Center of Irving' },
]

const EVENT_PATHS = ['', '/events', '/event', '/calendar', '/programs', '/classes', '/announcements']

const MASJID_ALIASES: Record<string, string[]> = {
  'Islamic Center of Rowlett': ['islamic center of rowlett', 'icr', 'rowlett masjid', 'masjid rowlett', 'rowlett'],
  'EPIC Masjid': ['epic masjid', 'east plano islamic center', 'epic', 'epic plano'],
  'American Imams Academy': ['american imams academy', 'aia', 'imams academy'],
  'SMS Masjid of Sachse': ['sms masjid of sachse', 'sms masjid', 'sachse masjid', 'masjid of sachse', 'sachse'],
  'Valley Ranch Islamic Center': ['valley ranch islamic center', 'vric', 'valley ranch masjid', 'valley ranch'],
  'Qalam Institute': ['qalam institute', 'qalam'],
  'Islamic Association of Collin County': ['islamic association of collin county', 'islamic assoc. of collin county', 'iacc', 'plano masjid'],
  'Masjid Yaseen': ['masjid yaseen', 'yaseen'],
  'IANT': ['iant', 'islamic association of north texas', 'north texas islamic association'],
  'Islamic Center of Irving': ['islamic center of irving', 'ici', 'irving masjid'],
}

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, key, {
    realtime: { transport: WebSocket as unknown as WebSocketLikeConstructor },
  })
}

function absoluteUrl(url: string | undefined, base: string): string | null {
  if (!url) return null
  try { return new URL(url, base).toString() } catch { return null }
}

function cleanText(value?: string | null): string | null {
  if (!value) return null
  const cleaned = value.replace(/\s+/g, ' ').trim()
  return cleaned.length ? cleaned : null
}

function cleanDescription(text: string, title: string, sourceName: string): string | null {
  let cleaned = text
    .replace(/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}\s*[•-]?\s*/gi, '')
    .replace(/\b\d+\s*min\s*read\b/gi, '')
    .replace(new RegExp(sourceName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '')
    .replace(/\bHilalz\s+Team\b/gi, '')
    .replace(/\bThe Weekend:?\s*/gi, '')
    .replace(/\s*•\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  cleaned = cleaned.replace(new RegExp(escapedTitle, 'gi'), '').replace(/\s+/g, ' ').trim()
  cleaned = cleaned.replace(/^[:\-•\s]+/, '').trim()

  if (!cleaned || cleaned.length < 20 || cleaned.toLowerCase().includes(title.toLowerCase().slice(0, 24))) {
    return `Tap to view full event details from ${sourceName}.`
  }
  return cleaned.length > 140 ? `${cleaned.slice(0, 137).trim()}...` : cleaned
}

function findMasjidMatch(text: string): string | null {
  const normalized = text.toLowerCase()
  for (const [masjidName, aliases] of Object.entries(MASJID_ALIASES)) {
    if (aliases.some(alias => normalized.includes(alias))) return masjidName
  }
  return null
}

function extractDate(text: string): string | null {
  const monthMatch = text.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:,\s*(\d{4}))?/i)
  if (monthMatch) {
    const parsed = new Date(`${monthMatch[1]} ${monthMatch[2]}, ${monthMatch[3] || new Date().getFullYear()}`)
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0]
  }
  const numericMatch = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/)
  if (numericMatch) {
    const year = numericMatch[3].length === 2 ? `20${numericMatch[3]}` : numericMatch[3]
    const parsed = new Date(`${year}-${numericMatch[1].padStart(2, '0')}-${numericMatch[2].padStart(2, '0')}`)
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0]
  }
  return null
}

function extractTime(text: string): string | null {
  const match = text.match(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i)
  return match ? match[0] : null
}

function extractSpeaker(text: string): string | null {
  const match = text.match(/(?:speaker|guest|imam|shaykh|sheikh|ustadh|ustadha|dr\.)[:\s]+([^|\n.]{3,120})/i)
  return match ? cleanText(match[1]) : null
}

function contentHash(event: RawEvent): string {
  return crypto.createHash('sha256').update([event.sourceName, event.sourceUrl, event.title, event.eventDate, event.matchedMasjidName].join('|')).digest('hex')
}

function looksLikeEvent(text: string, source: SourceDef): boolean {
  const normalized = text.toLowerCase()
  if (source.forcedMasjidName) {
    return /event|program|lecture|class|seminar|workshop|halaqa|youth|family|market|conference|qiyam|registration|friday night|weekend/i.test(text)
  }
  return Boolean(findMasjidMatch(text))
}

function buildEvent($: cheerio.CheerioAPI, node: cheerio.Cheerio<any>, source: SourceDef, pageUrl: string): RawEvent | null {
  const imageAlt = node.find('img').map((_, img) => $(img).attr('alt') || '').get().join(' ')
  const hrefText = node.find('a').map((_, a) => $(a).text()).get().join(' ')
  const text = cleanText([node.text(), imageAlt, hrefText].filter(Boolean).join(' '))
  if (!text || text.length < 8 || !looksLikeEvent(text, source)) return null

  const masjidName = source.forcedMasjidName || findMasjidMatch(text)
  if (!masjidName) return null

  const title = cleanText(node.find('h1,h2,h3,h4,a').first().text()) || cleanText(node.find('img').first().attr('alt')) || text.slice(0, 90)
  const href = absoluteUrl(node.find('a[href]').first().attr('href'), pageUrl) || pageUrl
  const imageUrl = absoluteUrl(node.find('img').first().attr('src') || node.find('img').first().attr('data-src') || node.find('img').first().attr('data-lazy-src'), pageUrl)

  return {
    title,
    eventDate: extractDate(text),
    eventTime: extractTime(text),
    location: cleanText(node.find('[class*=location], [class*=venue], address').first().text()) || masjidName,
    speakers: extractSpeaker(text),
    description: cleanDescription(text, title, source.name),
    imageUrl,
    sourceUrl: href,
    sourceName: source.name,
    matchedMasjidName: masjidName,
  }
}

async function scrapePage(source: SourceDef, pageUrl: string): Promise<RawEvent[]> {
  const response = await axios.get(pageUrl, {
    timeout: 20000,
    validateStatus: status => status >= 200 && status < 400,
    headers: {
      'User-Agent': 'IqamaTimeBot/1.0 (+https://github.com/rahimcantcode/IqamaTime)',
      Accept: 'text/html,application/xhtml+xml',
    },
  })
  const $ = cheerio.load(response.data)
  const candidates: RawEvent[] = []
  console.log(`${source.name}: scanned ${pageUrl}`)

  const selectors = ['article', '.event', '[class*=event]', '.post', '.card', 'li', 'a[href]', 'img']
  $(selectors.join(',')).each((_, element) => {
    const event = buildEvent($, $(element), source, pageUrl)
    if (event) candidates.push(event)
  })

  return candidates
}

async function scrapeSource(source: SourceDef): Promise<RawEvent[]> {
  const pageUrls = source.forcedMasjidName
    ? EVENT_PATHS.map(path => absoluteUrl(path, source.url)).filter(Boolean) as string[]
    : [source.url]

  const all: RawEvent[] = []
  for (const pageUrl of pageUrls) {
    try {
      const events = await scrapePage(source, pageUrl)
      all.push(...events)
    } catch (error) {
      logger.warn(source.name, `Could not scrape ${pageUrl}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const unique = new Map<string, RawEvent>()
  for (const event of all) unique.set(contentHash(event), event)
  return [...unique.values()].slice(0, 10)
}

async function upsertEvents(events: RawEvent[]) {
  const supabase = getSupabase()
  const { data: masjids, error: masjidError } = await supabase.from('masjids').select('id,name')
  if (masjidError) throw masjidError

  const masjidByName = new Map((masjids || []).map((m: { id: string; name: string }) => [m.name, m.id]))
  if (!events.length) throw new Error('No matching community events found from configured sources.')

  await supabase.from('community_events').update({ active: false }).eq('active', true)

  const rows = events.map(event => ({
    masjid_id: masjidByName.get(event.matchedMasjidName) ?? null,
    title: event.title,
    event_date: event.eventDate,
    event_time: event.eventTime,
    location: event.location,
    speakers: event.speakers,
    description: event.description,
    image_url: event.imageUrl,
    source_url: event.sourceUrl,
    source_name: event.sourceName,
    content_hash: contentHash(event),
    scraped_at: new Date().toISOString(),
    active: true,
  }))

  console.log(`Upserting ${rows.length} community_events rows`)
  const { error } = await supabase.from('community_events').upsert(rows, { onConflict: 'content_hash' })
  if (error) throw error
}

async function run() {
  const started = Date.now()
  console.log('\nIqamaTime Events Scraper')
  const allEvents: RawEvent[] = []

  for (const source of SOURCES) {
    const events = await scrapeSource(source)
    logger.info(source.name, `Found ${events.length} matching events`)
    events.forEach(event => console.log(`- ${event.sourceName}: ${event.title} => ${event.matchedMasjidName}`))
    allEvents.push(...events)
  }

  const unique = new Map<string, RawEvent>()
  for (const event of allEvents) unique.set(contentHash(event), event)
  await upsertEvents([...unique.values()])
  console.log(`Events scrape finished in ${((Date.now() - started) / 1000).toFixed(1)}s`)
}

run().catch(error => {
  console.error('Fatal error in events scraper:', error)
  process.exit(1)
})
