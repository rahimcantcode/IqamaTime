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

type EventRow = {
  title: string
  eventDate: string | null
  eventTime: string | null
  location: string | null
  description: string | null
  imageUrl: string | null
  sourceUrl: string
}

const SOURCE_NAME = 'IANT'
const MASJID_NAME = 'IANT'
const BASE_URL = 'https://iant.com'

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, key, { realtime: { transport: WebSocket as unknown as WebSocketLikeConstructor } })
}

function cleanText(value?: string | null): string | null {
  if (!value) return null
  const cleaned = value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&#038;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned.length ? cleaned : null
}

function absoluteUrl(url: string | undefined, base: string): string | null {
  if (!url || url.startsWith('mailto:') || url.startsWith('tel:')) return null
  try { return new URL(url, base).toString() } catch { return null }
}

function dateInDallas(offsetDays: number): string {
  const now = new Date()
  now.setDate(now.getDate() + offsetDays)
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

function buildUrls(): string[] {
  const urls = new Set<string>()
  urls.add(`${BASE_URL}/events/today/?hide_subsequent_recurrences=1`)
  for (let i = 0; i < 7; i++) {
    const day = dateInDallas(i)
    urls.add(`${BASE_URL}/events/${day}/?hide_subsequent_recurrences=1`)
    urls.add(`${BASE_URL}/events/list/?tribe-bar-date=${day}&hide_subsequent_recurrences=1`)
  }
  return [...urls]
}

function parseDate(text: string): string | null {
  const iso = text.match(/\b\d{4}-\d{2}-\d{2}\b/)
  if (iso) return iso[0]
  const month = text.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:,\s*(\d{4}))?/i)
  if (!month) return null
  const parsed = new Date(`${month[1]} ${month[2]}, ${month[3] || new Date().getFullYear()}`)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().split('T')[0]
}

function parseTime(text: string): string | null {
  const match = text.match(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i)
  return match ? match[0] : null
}

function cleanDescription(text: string, title: string): string {
  const cleaned = text
    .replace(title, '')
    .replace(/Search and Views Navigation/gi, '')
    .replace(/Enter Keyword.*?Find Events/gi, '')
    .replace(/Event Views Navigation.*?(List|Month|Day|Photo|Summary)/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!cleaned || cleaned.length < 24 || cleaned.toLowerCase().includes(title.toLowerCase().slice(0, 18))) {
    return 'Tap to view full event details from IANT.'
  }
  return cleaned.length > 180 ? `${cleaned.slice(0, 177).trim()}...` : cleaned
}

function contentHash(event: EventRow): string {
  return crypto.createHash('sha256').update([event.sourceUrl, event.title, event.eventDate, event.eventTime].join('|')).digest('hex')
}

function fromJsonLd(item: any, pageUrl: string): EventRow | null {
  if (!item || item['@type'] !== 'Event') return null
  const title = cleanText(item.name)
  if (!title || /^events?$/i.test(title) || title.length > 100) return null
  const desc = cleanText(item.description)
  const start = item.startDate ? String(item.startDate) : ''
  return {
    title,
    eventDate: start ? start.slice(0, 10) : parseDate(`${title} ${desc || ''}`),
    eventTime: parseTime(start) || parseTime(desc || ''),
    location: cleanText(item.location?.name || item.location?.address?.streetAddress) || MASJID_NAME,
    description: desc ? cleanDescription(desc, title) : 'Tap to view full event details from IANT.',
    imageUrl: Array.isArray(item.image) ? item.image[0] : item.image || null,
    sourceUrl: item.url || pageUrl,
  }
}

function fromNode($: cheerio.CheerioAPI, node: cheerio.Cheerio<any>, pageUrl: string): EventRow | null {
  const title = cleanText(
    node.find('.tribe-events-calendar-list__event-title a').first().text() ||
    node.find('.tribe-events-calendar-list__event-title').first().text() ||
    node.find('h2,h3,a').first().text()
  )
  if (!title || /^events?$|search|keyword|select date|now now/i.test(title) || title.length > 100) return null
  const text = cleanText(node.text()) || title
  if (/search and views navigation|enter keyword|select date|event views navigation/i.test(text)) return null
  const href = absoluteUrl(node.find('.tribe-events-calendar-list__event-title a').first().attr('href') || node.find('a[href]').first().attr('href'), pageUrl) || pageUrl
  const imageUrl = absoluteUrl(node.find('img').first().attr('src') || node.find('img').first().attr('data-src') || node.find('img').first().attr('data-lazy-src'), pageUrl)
  return {
    title,
    eventDate: parseDate(text) || parseDate(pageUrl),
    eventTime: parseTime(text),
    location: cleanText(node.find('.tribe-events-calendar-list__event-venue-title, .tribe-events-venue-details, address').first().text()) || MASJID_NAME,
    description: cleanDescription(text, title),
    imageUrl,
    sourceUrl: href,
  }
}

async function scrapePage(pageUrl: string): Promise<EventRow[]> {
  const response = await axios.get(pageUrl, {
    timeout: 20000,
    validateStatus: status => status >= 200 && status < 400,
    headers: { 'User-Agent': 'IqamaTimeBot/1.0', Accept: 'text/html,application/xhtml+xml' },
  })
  const $ = cheerio.load(response.data)
  const events: EventRow[] = []
  console.log(`IANT: scanned ${pageUrl}`)
  $('.tribe-events-calendar-list__event, article.tribe_events').each((_, el) => {
    const event = fromNode($, $(el), pageUrl)
    if (event) events.push(event)
  })
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).text())
      const items = Array.isArray(parsed) ? parsed : [parsed]
      for (const item of items) {
        const graph = Array.isArray(item?.['@graph']) ? item['@graph'] : [item]
        for (const graphItem of graph) {
          const event = fromJsonLd(graphItem, pageUrl)
          if (event) events.push(event)
        }
      }
    } catch {}
  })
  return events
}

async function scrapeUpcomingWeek(): Promise<EventRow[]> {
  const all: EventRow[] = []
  for (const url of buildUrls()) {
    try { all.push(...await scrapePage(url)) }
    catch (error) { logger.warn('IANT', `Could not scrape ${url}: ${error instanceof Error ? error.message : String(error)}`) }
  }
  const unique = new Map<string, EventRow>()
  for (const event of all) {
    if (!event.eventDate) continue
    unique.set(contentHash(event), event)
  }
  return [...unique.values()].sort((a, b) => `${a.eventDate} ${a.eventTime || ''}`.localeCompare(`${b.eventDate} ${b.eventTime || ''}`))
}

async function upsertEvents(events: EventRow[]) {
  const supabase = getSupabase()
  const { data: masjid, error: masjidError } = await supabase.from('masjids').select('id').eq('name', MASJID_NAME).maybeSingle()
  if (masjidError) throw masjidError
  await supabase.from('community_events').update({ active: false }).eq('active', true)
  if (!events.length) {
    logger.warn('IANT', 'No IANT events found for the upcoming week. Feed will show empty state.')
    return
  }
  const rows = events.map(event => ({
    masjid_id: masjid?.id ?? null,
    title: event.title,
    event_date: event.eventDate,
    event_time: event.eventTime,
    location: event.location,
    speakers: null,
    description: event.description,
    image_url: event.imageUrl,
    source_url: event.sourceUrl,
    source_name: SOURCE_NAME,
    content_hash: contentHash(event),
    scraped_at: new Date().toISOString(),
    active: true,
  }))
  console.log(`Upserting ${rows.length} IANT community_events rows`)
  const { error } = await supabase.from('community_events').upsert(rows, { onConflict: 'content_hash' })
  if (error) throw error
}

async function run() {
  console.log('\nIqamaTime Events Scraper: IANT upcoming week')
  const events = await scrapeUpcomingWeek()
  events.forEach(event => console.log(`- ${event.eventDate} ${event.eventTime || ''}: ${event.title}`))
  await upsertEvents(events)
}

run().catch(error => {
  console.error('Fatal error in IANT events scraper:', error)
  process.exit(1)
})
