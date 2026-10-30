#!/usr/bin/env node
import { config } from 'dotenv'
config({ path: '.env.local' })
import axios from 'axios'
import { replaceCommunityEventsForSource, type ScrapedCommunityEvent } from './database'
import { cancelledEventUrls, dedupeParsedEvents, parseEventPage, type EventSource } from './event-parsing'

export const EVENT_SOURCES: EventSource[] = [
  // /event is an unresolved organizers shortcode, not EPIC's current event feed.
  { name: 'EPIC Masjid', masjidName: 'EPIC Masjid', url: 'https://epicmasjid.org', paths: ['/'] },
  { name: 'SMS Masjid of Sachse', masjidName: 'SMS Masjid of Sachse', url: 'https://sachsemasjid.org', paths: ['/', '/sms-events-calendar/'] },
  { name: 'Qalam Institute', masjidName: 'Qalam Masjid', url: 'https://qalamcampus.org', paths: ['/'] },
]

export async function fetchEventPage(url: string): Promise<string> {
  const { data } = await axios.get(url, {
    timeout: 20000, headers: { 'User-Agent': 'IqamaTimeBot/1.0 (+https://github.com/rahimcantcode/IqamaTime)', Accept: 'text/html,application/xhtml+xml' },
  })
  if (typeof data !== 'string') throw new Error('Expected an HTML event source')
  return data
}

export async function collectSourceSnapshot(source: EventSource, fetchPage = fetchEventPage) {
  const events: ScrapedCommunityEvent[] = []
  const cancelledUrls = new Set<string>()
  // Any failed or unrecognized page makes the snapshot incomplete.
  for (const path of source.paths) {
    const url = new URL(path, source.url).toString()
    const html = await fetchPage(url)
    const pageEvents = parseEventPage(html, source, url)
    const cancellations = cancelledEventUrls(html, url)
    if (!pageEvents.length && !cancellations.length) throw new Error(`${source.name}: no events parsed from ${url}; preserving previous feed`)
    events.push(...pageEvents)
    cancellations.forEach(url => cancelledUrls.add(url))
  }
  return { events: dedupeParsedEvents(events).filter(event => !cancelledUrls.has(event.sourceUrl)), cancelledUrls: [...cancelledUrls] }
}

export async function collectSourceEvents(source: EventSource, fetchPage = fetchEventPage): Promise<ScrapedCommunityEvent[]> {
  const snapshot = await collectSourceSnapshot(source, fetchPage)
  if (!snapshot.events.length) throw new Error(`${source.name}: no events parsed; preserving previous feed`)
  return snapshot.events
}

export async function scrapeAllCommunityEvents(): Promise<void> {
  const failures: string[] = []
  for (const source of EVENT_SOURCES) {
    try {
      const events = await collectSourceEvents(source)
      await replaceCommunityEventsForSource({ masjidName: source.masjidName, sourceName: source.name, events, retireMissing: true })
      console.log(`${source.name}: refreshed ${events.length} events`)
    } catch (error) {
      const message = `${source.name}: ${error instanceof Error ? error.message : String(error)}`
      console.error(message)
      failures.push(message)
    }
  }
  // Other sources can refresh, but a partial refresh must not be reported as success.
  if (failures.length) throw new Error(failures.join('; '))
}

if (['events.ts', 'events.js'].includes(process.argv[1]?.split(/[\\/]/).pop() ?? '')) {
  scrapeAllCommunityEvents().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1 })
}
