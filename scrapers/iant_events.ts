#!/usr/bin/env node
import { config } from 'dotenv'
config({ path: '.env.local' })
import { dallasDate } from '../lib/dallas-date'
import { replaceCommunityEventsForSource } from './database'
import { collectSourceSnapshot } from './events'

export async function scrapeIANTEvents(): Promise<void> {
  // The list publishes explicit datetime attributes and JSON-LD for each occurrence.
  // A query's starting date is never substituted for an event's actual date.
  const source = {
    name: 'IANT', masjidName: 'IANT', url: 'https://iant.com',
    paths: [`/events/list/?tribe-bar-date=${dallasDate()}&hide_subsequent_recurrences=1`],
  }
  const snapshot = await collectSourceSnapshot(source)
  const events = snapshot.events.filter(event => event.eventDate && event.eventDate >= dallasDate())
  // This paginated calendar is not a complete snapshot: preserve unseen listings.
  await replaceCommunityEventsForSource({ masjidName: source.masjidName, sourceName: source.name, events, cancelledUrls: snapshot.cancelledUrls })
  console.log(`IANT: refreshed ${events.length} upcoming events`)
}

if (['iant_events.ts', 'iant_events.js'].includes(process.argv[1]?.split(/[\\/]/).pop() ?? '')) {
  scrapeIANTEvents().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1 })
}
