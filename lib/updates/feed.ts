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
  const match = value?.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return Infinity
  return (Number(match[1]) % 12 + (match[3].toUpperCase() === 'PM' ? 12 : 0)) * 60 + Number(match[2])
}

export function prepareFeed(events: FeedEvent[], today: string): FeedEvent[] {
  const unique = new Map<string, FeedEvent>()
  // A newly refreshed record wins over a legacy import of the same occurrence.
  for (const event of [...events].sort((a, b) => (b.scraped_at || '').localeCompare(a.scraped_at || ''))) {
    if (!safeEventUrl(event.source_url) || (event.event_date && event.event_date < today)) continue
    if (/^(campaigns?|announcements?|youth committee|events?|event organizers)$/i.test(event.title.trim())) continue
    if (event.source_url === 'https://masdfw.org/adults/') continue
    const title = event.title.toLocaleLowerCase().replace(/&[#a-z0-9]+;/gi, ' ').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
    // Distinct sessions of the same event must remain visible.
    const key = [event.source_name, title, event.event_date || '', event.event_time || ''].join('|')
    const existing = unique.get(key)
    if (!existing) unique.set(key, { ...event, image_url: safeEventUrl(event.image_url) })
    else unique.set(key, { ...existing, image_url: existing.image_url || safeEventUrl(event.image_url), description: existing.description || event.description })
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
