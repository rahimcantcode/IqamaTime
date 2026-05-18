import crypto from 'crypto'

export type EventRow = {
  title: string
  eventDate: string | null
  eventTime: string | null
  location: string | null
  description: string | null
  imageUrl: string | null
  sourceUrl: string
}

export const DEFAULT_IANT_DESCRIPTION = 'Tap to view full event details from IANT.'

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/&[#a-z0-9]+;/gi, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function eventKey(event: EventRow): string {
  return [
    normalizeTitle(event.title),
    event.eventDate || '',
    event.eventTime || '',
  ].join('|')
}

export function contentHash(event: EventRow): string {
  return crypto.createHash('sha256').update(eventKey(event)).digest('hex')
}

export function eventRank(event: EventRow, defaultLocation: string): number {
  return (
    (event.imageUrl ? 10 : 0) +
    (event.sourceUrl.includes('/event/') ? 5 : 0) +
    (event.location && event.location !== defaultLocation ? 2 : 0)
  )
}

export function dedupeEvents(events: EventRow[], defaultLocation: string): EventRow[] {
  const unique = new Map<string, EventRow>()

  for (const event of events) {
    if (!event.eventDate) continue

    const cleanEvent = {
      ...event,
      description: DEFAULT_IANT_DESCRIPTION,
    }

    const key = eventKey(cleanEvent)
    const existing = unique.get(key)

    if (!existing || eventRank(cleanEvent, defaultLocation) > eventRank(existing, defaultLocation)) {
      unique.set(key, cleanEvent)
    }
  }

  return [...unique.values()].sort((a, b) =>
    `${a.eventDate} ${a.eventTime || ''}`.localeCompare(`${b.eventDate} ${b.eventTime || ''}`)
  )
}
