#!/usr/bin/env node
import { config } from 'dotenv'
config({ path: '.env.local' })
import axios from 'axios'
import { replaceCommunityEventsForSource, type ScrapedCommunityEvent } from './database'
import { dedupeParsedEvents, parseEventPage, type EventSource } from './event-parsing'

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

export async function collectSourceEvents(source: EventSource, fetchPage = fetchEventPage): Promise<ScrapedCommunityEvent[]> {
  const events: ScrapedCommunityEvent[] = []
  // Any failed page makes the snapshot incomplete: leave that entire source intact.
  for (const path of source.paths) {
    const url = new URL(path, source.url).toString()
    const pageEvents = parseEventPage(await fetchPage(url), source, url)
    // HTTP 200 is not proof that the calendar rendered. Without a source-specific
    // trusted empty-state contract, zero parsed events make this page incomplete.
    if (!pageEvents.length) throw new Error(`${source.name}: no events parsed from ${url}; preserving previous feed`)
    events.push(...pageEvents)
  }
  const unique = dedupeParsedEvents(events)
  if (!unique.length) throw new Error(`${source.name}: no events parsed; preserving previous feed`)
  return unique
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
