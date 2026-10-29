export type FeedEvent = {
  id: string
  title: string
  event_date: string | null
  event_time: string | null
  location: string | null
  speakers: string | null
  description: string | null
  image_url: string | null
  source_url: string
  source_name: string
  masjids: { name: string } | null
  scraped_at?: string | null
  curated?: boolean
}

export function safeEventUrl(value: string | null | undefined): string | null {
  if (!value) return null
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : null } catch { return null }
}

export function eventTimeMinutes(value: string | null): number {
  const match = value?.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m\.?$/i)
  if (!match || Number(match[1]) < 1 || Number(match[1]) > 12 || Number(match[2] || 0) > 59) return Infinity
  return (Number(match[1]) % 12 + (match[3].toLowerCase() === 'p' ? 12 : 0)) * 60 + Number(match[2] || 0)
}

function normalizedTime(value: string | null): string | null {
  const minutes = eventTimeMinutes(value)
  if (!Number.isFinite(minutes)) return value?.trim() || null
  const hour = Math.floor(minutes / 60)
  return `${hour % 12 || 12}:${String(minutes % 60).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`
}

function occurrenceKey(event: FeedEvent, title: string): string {
  const url = new URL(event.source_url)
  // IANT's calendar assigns one dated permalink per recurring occurrence. Legacy
  // JSON-LD imports sometimes omitted its time; the permalink still identifies it.
  const datedOccurrence = url.hostname.replace(/^www\./, '') === 'iant.com'
    && /^\/event\/[^/]+\/\d{4}-\d{2}-\d{2}\/?$/.test(url.pathname)
    && url.pathname.replace(/\/$/, '').endsWith(`/${event.event_date}`)
  const session = datedOccurrence ? url.pathname.replace(/\/$/, '') : (event.event_time || '').toLowerCase().replace(/\s+/g, ' ')
  return [event.source_name, title, event.event_date || '', session].join('|')
}

function richerText(current: string | null, incoming: string | null, genericLabels: string[] = []): string | null {
  if (!current?.trim()) return incoming
  if (!incoming?.trim()) return current
  const currentBoilerplate = /^tap (?:here )?to view/i.test(current)
  const incomingBoilerplate = /^tap (?:here )?to view/i.test(incoming)
  if (currentBoilerplate !== incomingBoilerplate) return currentBoilerplate ? incoming : current
  // Length is not freshness: an older room/speaker/description must not replace
  // a newer correction. Only expand a known generic venue label with its address.
  const label = current.trim().toLowerCase()
  if (genericLabels.some(value => value.toLowerCase() === label) && incoming.toLowerCase().startsWith(label)) return incoming
  return current
}

export function prepareFeed(events: FeedEvent[], today: string): FeedEvent[] {
  const unique = new Map<string, FeedEvent>()
  // A newly refreshed record wins over a legacy import of the same occurrence.
  for (const raw of [...events].sort((a, b) => (b.scraped_at || '').localeCompare(a.scraped_at || ''))) {
    const event = { ...raw, event_time: normalizedTime(raw.event_time) }
    if (!safeEventUrl(event.source_url) || (event.event_date && event.event_date < today)) continue
    if (/^(campaigns?|announcements?|youth committee|events?|event organizers)$/i.test(event.title.trim())) continue
    if (event.source_url === 'https://masdfw.org/adults/') continue
    const title = event.title.toLocaleLowerCase().replace(/&[#a-z0-9]+;/gi, ' ').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
    // Distinct sessions of the same event must remain visible.
    const key = occurrenceKey(event, title)
    const existing = unique.get(key)
    if (!existing) unique.set(key, { ...event, image_url: safeEventUrl(event.image_url) })
    else unique.set(key, {
      ...existing,
      event_time: existing.event_time || event.event_time,
      image_url: existing.image_url || safeEventUrl(event.image_url),
      location: richerText(existing.location, event.location, ['Masjid', existing.source_name, `${existing.source_name} Masjid`, existing.masjids?.name || '']),
      speakers: richerText(existing.speakers, event.speakers),
      description: richerText(existing.description, event.description),
      masjids: existing.masjids || event.masjids,
    })
  }
  return [...unique.values()].sort((a, b) => (a.event_date || '9999').localeCompare(b.event_date || '9999') || eventTimeMinutes(a.event_time) - eventTimeMinutes(b.event_time) || a.title.localeCompare(b.title))
}

export function filterFeed(events: FeedEvent[], query: string, source: string): FeedEvent[] {
  const words = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean)
  return events.filter(event => (source === 'all' || event.source_name === source) && words.every(word =>
    [event.title, event.description, event.source_name, event.location, event.speakers].filter(Boolean).join(' ').toLocaleLowerCase().includes(word)))
}

export function freshnessLabel(event: FeedEvent, now: string): string {
  if (event.curated) return 'Saved recurring listing · confirm with organizer'
  const scraped = event.scraped_at ? Date.parse(event.scraped_at) : NaN
  if (!Number.isFinite(scraped)) return 'Refresh date unknown · verify with masjid'
  const age = Date.parse(now) - scraped
  const date = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric' }).format(new Date(scraped))
  return age > 8 * 86400000 ? `Last checked ${date} · verify with masjid` : `Source checked ${date}`
}

export function dateHeading(date: string | null, today: string): string {
  if (!date) return 'Programs & announcements'
  if (date === today) return 'Today'
  const tomorrow = new Date(Date.parse(`${today}T12:00:00Z`) + 86400000).toISOString().slice(0, 10)
  if (date === tomorrow) return 'Tomorrow'
  return new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', weekday: 'long', month: 'short', day: 'numeric' }).format(new Date(`${date}T12:00:00Z`))
}
