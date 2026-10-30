import * as cheerio from 'cheerio'
import type { AnyNode } from 'domhandler'
import { dallasDate } from '../lib/dallas-date'
import type { ScrapedCommunityEvent } from './database'

export type EventSource = { name: string; masjidName: string; url: string; paths: string[] }

export function eventUrl(value: unknown, base: string): string | null {
  if (typeof value !== 'string' || !value.trim() || value.startsWith('#')) return null
  try {
    const url = new URL(value, base)
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null
  } catch { return null }
}

export function eventText(value: unknown): string | null {
  if (typeof value !== 'string') return null
  // Decode entities before stripping markup (JSON-LD often contains encoded HTML).
  const decoded = cheerio.load(value).root().text()
  const text = cheerio.load(decoded).root().text().replace(/\\[nr]/g, ' ').replace(/\s+/g, ' ').trim()
  return text || null
}

export function validEventDate(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const instant = new Date(`${value}T12:00:00Z`)
  return !Number.isNaN(instant.getTime()) && instant.toISOString().slice(0, 10) === value ? value : null
}

export function eventDate(text: string): string | null {
  const iso = text.match(/\b\d{4}-\d{2}-\d{2}\b/)
  if (iso) return validEventDate(iso[0])
  // A yearless flyer is not evidence for this year's event. Never roll it forward.
  const month = text.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?[,]?\s+(\d{4})\b/i)
  if (month) {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    return validEventDate(`${month[3]}-${String(months.indexOf(month[1].slice(0, 3).toLowerCase()) + 1).padStart(2, '0')}-${month[2].padStart(2, '0')}`)
  }
  const numeric = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/)
  return numeric ? validEventDate(`${numeric[3]}-${numeric[1].padStart(2, '0')}-${numeric[2].padStart(2, '0')}`) : null
}

export function eventTime(text: string): string | null {
  const match = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i)
  if (!match || Number(match[1]) < 1 || Number(match[1]) > 12 || Number(match[2] || 0) > 59) return null
  return `${Number(match[1])}:${match[2] || '00'} ${match[3].toUpperCase()}`
}

export function eventStart(value: unknown): { date: string | null; time: string | null } {
  if (typeof value !== 'string') return { date: null, time: null }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return { date: eventDate(value), time: eventTime(value) }
  if (!validEventDate(value.slice(0, 10))) return { date: null, time: null }
  if (/(?:Z|[+-]\d{2}:?\d{2})$/.test(value)) {
    const instant = new Date(value)
    if (Number.isNaN(instant.getTime())) return { date: null, time: null }
    return { date: dallasDate(instant), time: new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit' }).format(instant) }
  }
  const hour = Number(value.slice(11, 13)), minute = Number(value.slice(14, 16))
  if (hour > 23 || minute > 59) return { date: null, time: null }
  return { date: value.slice(0, 10), time: `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}` }
}

export function jsonLdEvents(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.flatMap(jsonLdEvents)
  if (!value || typeof value !== 'object') return []
  const item = value as Record<string, unknown>
  const types = Array.isArray(item['@type']) ? item['@type'] : [item['@type']]
  const own = types.some(type => typeof type === 'string' && /(?:^|\/)\w*Event$/.test(type)) ? [item] : []
  return [...own, ...jsonLdEvents(item['@graph']), ...jsonLdEvents(item.itemListElement), ...jsonLdEvents(item.item)]
}

function goodTitle(title: string | null): title is string {
  return Boolean(title && title.length >= 4 && title.length <= 150 && !/^(?:(?:our )?events?|event organizers|programs?|services?|registration|committees?|education|campaigns?|announcements?|youth committee|search.*|select date)$/i.test(title))
}

function jsonLdEvent(item: Record<string, unknown>, source: EventSource, pageUrl: string): ScrapedCommunityEvent | null {
  const title = eventText(item.name)
  if (!goodTitle(title) || /EventCancelled|EventPostponed/.test(String(item.eventStatus))) return null
  const location = item.location && typeof item.location === 'object' ? item.location as Record<string, unknown> : {}
  const start = eventStart(item.startDate)
  const image = Array.isArray(item.image) ? item.image[0] : item.image
  const imageUrl = image && typeof image === 'object' ? (image as Record<string, unknown>).url : image
  return {
    title, eventDate: start.date, eventTime: start.time,
    location: eventText(location.name) || source.masjidName, speakers: null,
    description: eventText(item.description), imageUrl: eventUrl(imageUrl, pageUrl),
    sourceUrl: eventUrl(item.url, pageUrl) || pageUrl, sourceName: source.name,
  }
}

function nodeEvent($: cheerio.CheerioAPI, node: cheerio.Cheerio<AnyNode>, source: EventSource, pageUrl: string): ScrapedCommunityEvent | null {
  const heading = node.find('.tribe-events-calendar-list__event-title, h1, h2, h3, h4').first()
  const title = eventText(heading.text())
  if (!goodTitle(title)) return null
  const text = eventText(node.text()) || title
  if (/search and views navigation|enter keyword|event views navigation/i.test(text)) return null
  const link = heading.find('a[href]').first().attr('href') || node.find('a[href]').first().attr('href')
  const sourceUrl = eventUrl(link, pageUrl) || pageUrl
  const dateTime = node.find('time[datetime]').first()
  const start = eventStart(dateTime.attr('datetime'))
  const date = start.date || eventDate(text)
  const image = node.find('img').first()
  const imageUrl = eventUrl(image.attr('data-lazy-src') || image.attr('data-src') || image.attr('src'), pageUrl)
  if (!date && !imageUrl && !/lecture|seminar|workshop|halaqa|class|series|qiyam|iftar|conference|retreat|camp|youth|family/i.test(title)) return null
  return {
    title, eventDate: date, eventTime: start.time || eventTime(dateTime.text() || text),
    location: eventText(node.find('address, .tribe-events-venue-details').first().text()) || source.masjidName,
    speakers: null, description: eventText(node.find('.tribe-events-calendar-list__event-description, .entry-summary, .excerpt').first().text()),
    imageUrl, sourceUrl, sourceName: source.name,
  }
}

export function parseQalamPrograms(html: string, source: EventSource): ScrapedCommunityEvent[] {
  const $ = cheerio.load(html)
  const list = $('h1,h2,h3,h4').filter((_, el) => $(el).text().trim() === 'Weekly Programs').first().next('ul')
  const events: ScrapedCommunityEvent[] = []
  list.children('li').each((_, el) => {
    const day = $(el).children('p').first().text().trim()
    if (!/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/i.test(day)) return
    $(el).find('ul li').each((_, program) => {
      const node = $(program), title = eventText(node.find('a').first().text()), text = eventText(node.text())
      if (!goodTitle(title) || !text) return
      const time = eventTime(text) || (/post-isha/i.test(text) ? 'after Isha' : null)
      events.push({ title, eventDate: null, eventTime: `${day}${time ? ` · ${time}` : ''}`, location: source.masjidName,
        speakers: eventText(text.match(/\bwith\s+(.+?)(?:\s*\(|$)/i)?.[1]), description: text,
        imageUrl: null, sourceUrl: source.url, sourceName: source.name })
    })
  })
  return events
}


export function parseEpicAnnouncements(html: string, source: EventSource): ScrapedCommunityEvent[] {
  const $ = cheerio.load(html)
  const events: ScrapedCommunityEvent[] = []
  $('.rt-post-slider .slider-direction[id]').each((_, el) => {
    const node = $(el), link = node.find('h3 a[href]').first(), title = eventText(link.text())
    if (!goodTitle(title)) return
    const image = node.closest('.rt-post-slider').find('img[title]').filter((_, img) => $(img).attr('title') === `#${node.attr('id')}`).first()
    const imageUrl = eventUrl(image.attr('data-lazy-src') || image.attr('data-src') || image.attr('src'), source.url)
    if (!imageUrl) return
    events.push({ title, eventDate: null, eventTime: null, location: source.masjidName, speakers: null,
      description: 'Announcement currently linked by EPIC. Check the full flyer and organizer for dates and availability.',
      imageUrl, sourceUrl: eventUrl(link.attr('href'), source.url) || source.url, sourceName: source.name })
  })
  return events
}

// Only explicit structured cancellation notices may retire a known occurrence.
export function cancelledEventUrls(html: string, pageUrl: string): string[] {
  const $ = cheerio.load(html)
  const urls = new Set<string>()
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      for (const item of jsonLdEvents(JSON.parse($(el).text()))) {
        if (!/EventCancelled|EventPostponed/.test(String(item.eventStatus))) continue
        const url = eventUrl(item.url, pageUrl)
        const date = eventStart(item.startDate).date
        // IANT's dated permalink identifies exactly one recurring occurrence.
        // Never retire every session sharing a generic event page.
        if (url && date && new URL(url).origin === new URL(pageUrl).origin
          && new URL(url).pathname.replace(/\/$/, '').endsWith(`/${date}`)) urls.add(url)
      }
    } catch { /* Invalid metadata is not evidence of cancellation. */ }
  })
  return [...urls]
}

export function parseEventPage(html: string, source: EventSource, pageUrl: string): ScrapedCommunityEvent[] {
  const $ = cheerio.load(html)
  const events: ScrapedCommunityEvent[] = []
  const cancelled = new Set<string>()
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      for (const item of jsonLdEvents(JSON.parse($(el).text()))) {
        if (/EventCancelled|EventPostponed/.test(String(item.eventStatus))) {
          const url = eventUrl(item.url, pageUrl)
          if (url) cancelled.add(url)
          cancelled.add(`${eventText(item.name)}|${eventStart(item.startDate).date || ''}`)
        }
        const event = jsonLdEvent(item, source, pageUrl)
        if (event) events.push(event)
      }
    } catch { /* One malformed metadata block must not hide valid event cards. */ }
  })
  $('nav, footer, script, style, noscript').remove()
  $('article, .event, .tribe-events-calendar-list__event, .event-card, .event-item').each((_, el) => {
    const event = nodeEvent($, $(el), source, pageUrl)
    if (event) events.push(event)
  })
  if (source.url === 'https://qalamcampus.org') events.push(...parseQalamPrograms(html, source))
  if (source.url === 'https://epicmasjid.org') events.push(...parseEpicAnnouncements(html, source))
  return dedupeParsedEvents(events.filter(event => !cancelled.has(event.sourceUrl) && !cancelled.has(`${event.title}|${event.eventDate || ''}`)))
}

export function dedupeParsedEvents(events: ScrapedCommunityEvent[]): ScrapedCommunityEvent[] {
  const unique = new Map<string, ScrapedCommunityEvent>()
  for (const event of events) {
    const key = [event.sourceName, event.title.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim(), event.eventDate || '', event.eventTime || ''].join('|')
    const existing = unique.get(key)
    unique.set(key, existing ? { ...existing, imageUrl: existing.imageUrl || event.imageUrl, description: existing.description || event.description } : event)
  }
  return [...unique.values()]
}
