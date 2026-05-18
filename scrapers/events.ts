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

interface SourceDef {
  name: string
  url: string
  masjidName: string
  paths: string[]
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
  sourceName: string
  matchedMasjidName: string
}

const SOURCES: SourceDef[] = [
  {
    name: 'EPIC Masjid',
    masjidName: 'EPIC Masjid',
    url: 'https://epicmasjid.org',
    paths: ['/', '/events', '/event'],
  },
  {
    name: 'SMS Masjid of Sachse',
    masjidName: 'SMS Masjid of Sachse',
    url: 'https://sachsemasjid.org',
    paths: ['/', '/events', '/calendar'],
  },
  {
    name: 'Qalam Institute',
    masjidName: 'Qalam Institute',
    url: 'https://qalamcampus.org',
    paths: ['/', '/events', '/calendar'],
  },
]

const BAD_TITLE_PATTERNS = [
  /^no events?$/i,
  /^events?$/i,
  /^programs?$/i,
  /^services?$/i,
  /^registration$/i,
  /^committees?$/i,
  /^education$/i,
  /^search/i,
  /^enter keyword/i,
  /advanced search/i,
  /events? found/i,
  /select date/i,
  /now now/i,
  /geo_placeholder/i,
  /email-protection/i,
]

const EVENT_WORDS = /lecture|seminar|workshop|halaqa|qiyam|iftar|dinner|fundraiser|conference|retreat|camp|market|class|series|youth|family|guest speaker|registration open|announcement|upcoming/i

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')

  return createClient(url, key, {
    realtime: { transport: WebSocket as unknown as WebSocketLikeConstructor },
  })
}

function absoluteUrl(url: string | undefined, base: string): string | null {
  if (!url || url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('#')) return null
  try {
    return new URL(url, base).toString()
  } catch {
    return null
  }
}

function cleanText(value?: string | null): string | null {
  if (!value) return null
  const cleaned = value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned.length ? cleaned : null
}

function isBadTitle(title: string) {
  const cleaned = title.trim()
  if (cleaned.length < 4 || cleaned.length > 90) return true
  return BAD_TITLE_PATTERNS.some(pattern => pattern.test(cleaned))
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

function cleanDescription(text: string, title: string, sourceName: string): string {
  let cleaned = text
    .replace(title, '')
    .replace(/\b\d+\s*min\s*read\b/gi, '')
    .replace(/search and views navigation/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleaned || cleaned.length < 24 || cleaned.toLowerCase().includes(title.toLowerCase().slice(0, 18))) {
    return `Tap to view full event details from ${sourceName}.`
  }

  return cleaned.length > 150 ? `${cleaned.slice(0, 147).trim()}...` : cleaned
}

function contentHash(event: RawEvent): string {
  return crypto
    .createHash('sha256')
    .update([event.sourceName, event.sourceUrl, event.title, event.eventDate, event.matchedMasjidName].join('|'))
    .digest('hex')
}

function hasRealEventSignal(title: string, text: string, href: string | null, imageUrl: string | null, date: string | null) {
  if (isBadTitle(title)) return false
  if (/geo_placeholder|location options|state\/county|distance units|search and views navigation|select date|now now/i.test(text)) return false

  const urlLooksUseful = Boolean(href && /event|events|calendar|announcement|registration|program|class/i.test(href))
  const hasContentSignal = Boolean(date || imageUrl || EVENT_WORDS.test(`${title} ${text}`))

  return urlLooksUseful && hasContentSignal
}

function buildFromNode($: cheerio.CheerioAPI, node: cheerio.Cheerio<any>, source: SourceDef, pageUrl: string): RawEvent | null {
  const imageAlt = node.find('img').map((_, img) => $(img).attr('alt') || '').get().join(' ')
  const text = cleanText([node.text(), imageAlt].filter(Boolean).join(' '))
  if (!text) return null

  const title =
    cleanText(node.find('h1,h2,h3,h4,a').first().text()) ||
    cleanText(node.find('img').first().attr('alt')) ||
    text.slice(0, 80)

  if (!title) return null

  const href = absoluteUrl(node.find('a[href]').first().attr('href'), pageUrl) || pageUrl
  const imageUrl = absoluteUrl(
    node.find('img').first().attr('src') ||
      node.find('img').first().attr('data-src') ||
      node.find('img').first().attr('data-lazy-src'),
    pageUrl
  )
  const eventDate = extractDate(text)

  if (!hasRealEventSignal(title, text, href, imageUrl, eventDate)) return null

  return {
    title,
    eventDate,
    eventTime: extractTime(text),
    location: source.masjidName,
    speakers: extractSpeaker(text),
    description: cleanDescription(text, title, source.name),
    imageUrl,
    sourceUrl: href,
    sourceName: source.name,
    matchedMasjidName: source.masjidName,
  }
}

function buildFromJsonLd(item: any, source: SourceDef, pageUrl: string): RawEvent | null {
  if (item?.['@type'] !== 'Event') return null

  const title = cleanText(item.name)
  if (!title || isBadTitle(title)) return null

  const text = cleanText(`${item.name || ''} ${item.description || ''} ${item.location?.name || ''}`) || title
  const eventDate = item.startDate ? String(item.startDate).slice(0, 10) : extractDate(text)

  return {
    title,
    eventDate,
    eventTime: extractTime(String(item.startDate || text)),
    location: cleanText(item.location?.name || item.location?.address?.streetAddress) || source.masjidName,
    speakers: null,
    description: cleanDescription(text, title, source.name),
    imageUrl: Array.isArray(item.image) ? item.image[0] : item.image || null,
    sourceUrl: item.url || pageUrl,
    sourceName: source.name,
    matchedMasjidName: source.masjidName,
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

  const selectors = ['article', '.event', '[class*=event]', '.tribe-events-calendar-list__event', '.post', '.card', 'section']
  $(selectors.join(',')).each((_, element) => {
    const event = buildFromNode($, $(element), source, pageUrl)
    if (event) candidates.push(event)
  })

  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      const parsed = JSON.parse($(element).text())
      const items = Array.isArray(parsed) ? parsed : [parsed]
      for (const item of items) {
        const event = buildFromJsonLd(item, source, pageUrl)
        if (event) candidates.push(event)
      }
    } catch {}
  })

  return candidates
}

async function scrapeSource(source: SourceDef): Promise<RawEvent[]> {
  const all: RawEvent[] = []

  for (const path of source.paths) {
    const pageUrl = absoluteUrl(path, source.url)
    if (!pageUrl) continue

    try {
      all.push(...await scrapePage(source, pageUrl))
    } catch (error) {
      logger.warn(source.name, `Could not scrape ${pageUrl}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const unique = new Map<string, RawEvent>()
  for (const event of all) unique.set(contentHash(event), event)
  return [...unique.values()].slice(0, 6)
}

async function upsertEvents(events: RawEvent[]) {
  const supabase = getSupabase()
  const { data: masjids, error: masjidError } = await supabase.from('masjids').select('id,name')
  if (masjidError) throw masjidError

  const masjidByName = new Map((masjids || []).map((m: { id: string; name: string }) => [m.name, m.id]))

  await supabase.from('community_events').update({ active: false }).eq('active', true)

  if (!events.length) {
    logger.warn('Events', 'No clean EPIC, Sachse, or Qalam events found. Feed will show empty state.')
    return
  }

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

  console.log(`Upserting ${rows.length} clean community_events rows`)
  const { error } = await supabase.from('community_events').upsert(rows, { onConflict: 'content_hash' })
  if (error) throw error
}

async function run() {
  const started = Date.now()
  console.log('\nIqamaTime Events Scraper: EPIC, Sachse, Qalam only')
  const allEvents: RawEvent[] = []

  for (const source of SOURCES) {
    const events = await scrapeSource(source)
    logger.info(source.name, `Found ${events.length} clean events`)
    events.forEach(event => console.log(`- ${event.sourceName}: ${event.title}`))
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
