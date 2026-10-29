import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { eventDate, eventStart, eventUrl, eventText, jsonLdEvents, parseEventPage, type EventSource } from './event-parsing'
import { collectSourceEvents } from './events'
import { replaceCommunityEventsForSource, type ScrapedCommunityEvent } from './database'
import { dateHeading, filterFeed, freshnessLabel, prepareFeed, type FeedEvent } from '../lib/updates/feed'

const source = (name: string, url: string): EventSource => ({ name, masjidName: name, url, paths: ['/'] })
const fixture = (name: string) => readFileSync(`scrapers/fixtures/${name}.html`, 'utf8')
const parsed: ScrapedCommunityEvent = { title: 'Community class', eventDate: '2026-11-01', eventTime: '9:00 AM', location: 'Masjid', speakers: null, description: null, imageUrl: null, sourceUrl: 'https://masjid.example/event/1', sourceName: 'Masjid' }
const event: FeedEvent = { id: '1', title: parsed.title, event_date: parsed.eventDate, event_time: parsed.eventTime, location: parsed.location, speakers: null, description: null, image_url: null, source_url: parsed.sourceUrl, source_name: parsed.sourceName, masjids: null, scraped_at: '2026-10-29T12:00:00Z' }

test('event dates are valid and never guess the year of a flyer', () => {
  assert.equal(eventDate('November 1'), null)
  assert.equal(eventDate('Feb 31, 2026'), null)
  assert.equal(eventDate('2026-02-30'), null)
  assert.equal(eventDate('November 1, 2026'), '2026-11-01')
  assert.equal(eventDate('11/01/2026'), '2026-11-01')
})

test('JSON-LD ISO times retain the Dallas date, time and DST offset', () => {
  assert.deepEqual(eventStart('2026-11-01T09:00:00-06:00'), { date: '2026-11-01', time: '9:00 AM' })
  assert.deepEqual(eventStart('2026-10-30T01:30:00Z'), { date: '2026-10-29', time: '8:30 PM' })
  assert.deepEqual(eventStart('2026-11-02T20:30:00'), { date: '2026-11-02', time: '8:30 PM' })
  assert.deepEqual(eventStart('2026-11-02'), { date: '2026-11-02', time: null })
  assert.deepEqual(eventStart('2026-11-02T29:00:00'), { date: null, time: null })
})

test('structured events traverse graphs and lists; cancelled events are not advertised', () => {
  assert.equal(jsonLdEvents({ '@graph': [{ '@type': ['Thing', 'Event'], name: 'A' }, { itemListElement: [{ item: { '@type': 'EducationEvent', name: 'B' } }] }] }).length, 2)
  const html = '<script type="application/ld+json">{"@graph":[{"@type":"Event","name":"Cancelled class","eventStatus":"https://schema.org/EventCancelled","url":"https://masjid.example/event/cancelled"}]}</script><article><h3><a href="/event/cancelled">Cancelled class</a></h3></article>'
  assert.deepEqual(parseEventPage(html, source('Masjid', 'https://masjid.example'), 'https://masjid.example'), [])
  assert.equal(eventText('&lt;p&gt;Support &#038; Counseling&lt;/p&gt;'), 'Support & Counseling')
})

test('Qalam gets weekly programs without treating prayer times or navigation as events', () => {
  const events = parseEventPage(fixture('qalam-programs'), source('Qalam Institute', 'https://qalamcampus.org'), 'https://qalamcampus.org')
  assert.equal(events.length, 3)
  assert.deepEqual(events.map(event => event.eventTime), ['Tuesday · after Isha', 'Wednesday · 7:15 PM', 'Thursday · after Isha'])
  assert.ok(events.every(event => event.eventDate === null))
  assert.equal(events[0].speakers, 'Shaykh AbdulNasir Jangda')
})

test('EPIC flyers come from linked announcements, without inventing dates from upload paths', () => {
  const events = parseEventPage(fixture('epic-announcements'), source('EPIC Masjid', 'https://epicmasjid.org'), 'https://epicmasjid.org')
  assert.equal(events.length, 6)
  assert.ok(events.every(event => event.eventDate === null && event.eventTime === null && event.imageUrl?.startsWith('https://epicmasjid.org/')))
  assert.ok(events.some(event => event.title === 'Sisters Social'))
})

test('IANT preserves real occurrences, JSON-LD times, lazy-loaded flyers, and de-duplicates cards', () => {
  const events = parseEventPage(fixture('iant-events'), source('IANT', 'https://iant.com'), 'https://iant.com/events/list/?tribe-bar-date=2026-10-29')
  assert.equal(events.length, 6)
  const minhaj = events.find(event => event.title === 'Mukhtasar Minhaj Al Qasidin')!
  assert.equal(minhaj.eventDate, '2026-11-02')
  assert.equal(minhaj.eventTime, '8:30 PM')
  assert.match(minhaj.imageUrl!, /Minhaj\.jpg$/)
  assert.ok(events.every(event => !event.imageUrl?.startsWith('data:')))
})

test('a listing query date is never assigned to an undated event', () => {
  const events = parseEventPage('<article><h3><a href="/event/class">Community class</a></h3><p>November 1 at 9 AM</p></article>', source('IANT', 'https://iant.com'), 'https://iant.com/events/list/?tribe-bar-date=2026-10-29')
  assert.equal(events[0].eventDate, null)
})

test('source snapshots reject partial failures and zero events instead of replacing the feed', async () => {
  const feedSource = { ...source('Masjid', 'https://masjid.example'), paths: ['/', '/events'] }
  await assert.rejects(collectSourceEvents(feedSource, async url => {
    if (url.endsWith('/events')) throw new Error('HTTP 403')
    return '<article><h3>Community class</h3><time datetime="2026-11-01">9 AM</time></article>'
  }), /403/)
  await assert.rejects(collectSourceEvents(feedSource, async () => '<p>[madina_events]</p>'), /preserving previous feed/)
})

test('one valid page cannot conceal a required page with HTTP-200 broken markup', async () => {
  const feedSource = { ...source('SMS Masjid of Sachse', 'https://sachsemasjid.org'), paths: ['/', '/sms-events-calendar/'] }
  await assert.rejects(collectSourceEvents(feedSource, async url => url.endsWith('/sms-events-calendar/')
    ? '<html><body><p>[madina_events]</p></body></html>'
    : '<article><h3>Community class</h3><time datetime="2026-11-01">9 AM</time></article>'), /no events parsed.*preserving previous feed/)
})

test('event dry runs need no credentials and never create a database client', async () => {
  const previous = process.env.SCRAPE_DRY_RUN
  process.env.SCRAPE_DRY_RUN = '1'
  try {
    await replaceCommunityEventsForSource({ masjidName: 'Masjid', sourceName: 'Masjid', events: [parsed] }, () => { throw new Error('must not connect') })
  } finally {
    if (previous === undefined) delete process.env.SCRAPE_DRY_RUN
    else process.env.SCRAPE_DRY_RUN = previous
  }
})

test('failed database writes never retire or delete existing listings', async () => {
  const calls: string[] = []
  const fake = { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: 'm' }, error: null }) }) }), upsert: async () => { calls.push('upsert'); return { error: new Error('write failed') } }, update: () => { calls.push('cleanup'); throw new Error('unsafe cleanup') }, delete: () => { calls.push('delete'); throw new Error('unsafe delete') } }) }
  const factory = () => fake as unknown as ReturnType<NonNullable<Parameters<typeof replaceCommunityEventsForSource>[1]>>
  await assert.rejects(replaceCommunityEventsForSource({ masjidName: 'Masjid', sourceName: 'Masjid', events: [parsed], retireMissing: true }, factory), /write failed/)
  assert.deepEqual(calls, ['upsert'])
})

test('feed removes unsafe placeholder images and keeps separate sessions in chronological order', () => {
  const feed = prepareFeed([{ ...event, id: 'pm', event_time: '2:00 PM' }, { ...event, id: 'am', event_time: '10:00 AM', image_url: 'data:image/svg+xml,placeholder' }, { ...event, id: 'past', event_date: '2026-10-01' }, { ...event, id: 'unsafe', source_url: 'javascript:alert(1)' }], '2026-10-29')
  assert.deepEqual(feed.map(event => event.id), ['am', 'pm'])
  assert.equal(feed[0].image_url, null)
  assert.equal(filterFeed(feed, 'community masjid', 'Masjid').length, 2)
  assert.equal(filterFeed(feed, 'no match', 'all').length, 0)
  assert.equal(eventUrl('data:image/svg+xml,placeholder', 'https://iant.com'), null)
})

test('dated headings and old or manually curated freshness are explicit', () => {
  assert.equal(dateHeading('2026-10-29', '2026-10-29'), 'Today')
  assert.equal(dateHeading('2026-10-30', '2026-10-29'), 'Tomorrow')
  assert.match(freshnessLabel({ ...event, scraped_at: '2026-10-01T00:00:00Z' }, '2026-10-29T00:00:00Z'), /verify with masjid/)
  assert.match(freshnessLabel({ ...event, curated: true }, '2026-10-29T00:00:00Z'), /Saved recurring listing/)
  assert.match(freshnessLabel({ ...event, scraped_at: null }, '2026-10-29T00:00:00Z'), /Refresh date unknown/)
})

test('live IANT legacy/current pairs merge equivalent times and dated occurrence metadata', () => {
  const pairs = [
    { title: 'Support & Counseling for Single Mothers and Widows', date: '2026-10-29', slug: 'support-counseling-for-single-mothers-and-widows', current: '5:00 PM', legacy: null },
    { title: 'Tafsir Program', date: '2026-11-01', slug: 'tafsir', current: '9:00 AM', legacy: '9am' },
    { title: 'Mukhtasar Minhaj Al Qasidin', date: '2026-11-02', slug: 'mukhtasar-minhaj-al-qasidin', current: '8:30 PM', legacy: null },
  ]
  const rows = pairs.flatMap((pair, i) => {
    const base = { ...event, title: pair.title, event_date: pair.date, source_name: 'IANT', source_url: `https://iant.com/event/${pair.slug}/${pair.date}/` }
    return [
      { ...base, id: `current-${i}`, event_time: pair.current, image_url: null, location: 'IANT Masjid 840 Abrams Road, Richardson, TX', scraped_at: '2026-10-29T12:00:00Z' },
      { ...base, id: `legacy-${i}`, event_time: pair.legacy, image_url: `https://iant.com/flyer-${i}.jpg`, location: 'IANT Masjid', description: 'A full program description from the organizer.', scraped_at: '2026-10-22T12:00:00Z' },
    ]
  })
  const feed = prepareFeed(rows, '2026-10-29')
  assert.equal(feed.length, 3)
  assert.deepEqual(feed.map(row => row.event_time), ['5:00 PM', '9:00 AM', '8:30 PM'])
  assert.ok(feed.every(row => row.image_url && row.location?.includes('840 Abrams Road') && row.description))
})

test('equivalent generic times merge while distinct sessions sharing a generic URL remain separate', () => {
  const feed = prepareFeed([
    { ...event, id: 'one', event_time: '9:00 AM', image_url: null, location: 'Masjid' },
    { ...event, id: 'duplicate', event_time: '9am', image_url: 'https://masjid.example/flyer.jpg', location: 'Masjid, 123 Main Street' },
    { ...event, id: 'second-session', event_time: '2 PM' },
  ], '2026-10-29')
  assert.equal(feed.length, 2)
  assert.deepEqual(feed.map(row => row.event_time), ['9:00 AM', '2:00 PM'])
  assert.equal(feed[0].image_url, 'https://masjid.example/flyer.jpg')
  assert.equal(feed[0].location, 'Masjid, 123 Main Street')
})


test('newer venue, speaker and description corrections beat longer outdated text', () => {
  const feed = prepareFeed([
    { ...event, id: 'new', event_time: '9am', location: 'Room 2', speakers: 'Ali', description: 'Moved online.', scraped_at: '2026-10-29T12:00:00Z' },
    { ...event, id: 'old', event_time: '9:00 AM', location: 'IANT Masjid, 840 Abrams Road', speakers: 'Ali and a previous speaker', description: 'Meet in the old venue for a long in-person gathering.', scraped_at: '2026-10-22T12:00:00Z' },
  ], '2026-10-29')
  assert.equal(feed.length, 1)
  assert.equal(feed[0].location, 'Room 2')
  assert.equal(feed[0].speakers, 'Ali')
  assert.equal(feed[0].description, 'Moved online.')
})
