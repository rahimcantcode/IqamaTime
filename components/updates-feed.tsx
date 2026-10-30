'use client'

import { useState } from 'react'
import Image from 'next/image'
import * as Dialog from '@radix-ui/react-dialog'
import { CalendarDays, ExternalLink, MapPin, Mic, Search, X, ZoomIn } from 'lucide-react'
import { dateHeading, filterFeed, freshnessLabel, type FeedEvent } from '@/lib/updates/feed'

function Flyer({ event }: { event: FeedEvent }) {
  const [failed, setFailed] = useState(false)
  if (!event.image_url || failed) return null
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button type="button" className="relative block aspect-[4/3] w-full bg-[#F3F4EF] focus-visible:outline-2 focus-visible:outline-[#4F6F52]" aria-label={`View full flyer: ${event.title}`}>
          <Image src={event.image_url} alt={`${event.title} flyer`} fill unoptimized sizes="(max-width: 640px) 100vw, 600px" className="object-contain p-2" onError={() => setFailed(true)} />
          <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/95 px-3 py-2 text-xs font-semibold text-[#344C37]"><ZoomIn size={14} /> Full flyer</span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[94dvh] w-[calc(100%-1.5rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl bg-white p-4 shadow-xl">
          <div className="mb-3 flex items-start justify-between gap-3">
            <Dialog.Title className="font-semibold text-[#242B25]">{event.title}</Dialog.Title>
            <Dialog.Close aria-label="Close flyer" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F3F4EF]"><X size={20} /></Dialog.Close>
          </div>
          <Dialog.Description className="mb-3 text-sm text-[#595550]">Full flyer from {event.source_name}. Confirm the schedule with the organizer.</Dialog.Description>
          <div className="relative h-[65dvh] min-h-0 w-full"><Image src={event.image_url} alt={`${event.title} full flyer`} fill unoptimized sizes="100vw" className="object-contain" /></div>
          <a href={event.image_url} target="_blank" rel="noopener noreferrer" className="mt-3 text-center text-sm font-semibold text-[#4F6F52] underline">Open original flyer to zoom</a>
          <a href={event.source_url} target="_blank" rel="noopener noreferrer" className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#4F6F52] px-4 text-sm font-semibold text-white">View organizer details <ExternalLink size={14} /></a>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default function UpdatesFeed({ events, today, now }: { events: FeedEvent[]; today: string; now: string }) {
  const [query, setQuery] = useState('')
  const [source, setSource] = useState('all')
  const sources = [...new Set(events.map(event => event.source_name))].sort()
  const visible = filterFeed(events, query, source)
  const groups = new Map<string, FeedEvent[]>()
  for (const event of visible) {
    const group = event.event_date || 'undated'
    groups.set(group, [...(groups.get(group) || []), event])
  }

  return (
    <>
      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="relative block">
          <span className="sr-only">Search community updates</span>
          <Search aria-hidden="true" size={17} className="absolute left-3 top-3.5 text-[#687266]" />
          <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search events, speakers, places" className="h-11 w-full rounded-xl border border-[#D9DED3] bg-white pl-10 pr-3 text-sm outline-offset-2 focus-visible:outline-[#4F6F52]" />
        </label>
        <label>
          <span className="sr-only">Filter by masjid</span>
          <select value={source} onChange={event => setSource(event.target.value)} className="h-11 w-full rounded-xl border border-[#D9DED3] bg-white px-3 text-sm sm:max-w-56">
            <option value="all">All masjids</option>
            {sources.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
      </div>
      <p className="mb-4 text-xs text-[#595550]" role="status">{visible.length} {visible.length === 1 ? 'listing' : 'listings'}{query || source !== 'all' ? ' match your filters' : ''}</p>
      {!visible.length && (
        <div className="rounded-2xl border border-[#E7E2D8] bg-white p-7 text-center">
          <h2 className="font-semibold">{events.length ? 'No matching updates' : 'No upcoming listings available'}</h2>
          <p className="mt-2 text-sm text-[#595550]">{events.length ? 'Try another search or masjid.' : 'Check your masjid’s website for the latest events.'}</p>
          {(query || source !== 'all') && <button type="button" onClick={() => { setQuery(''); setSource('all') }} className="mt-3 min-h-11 rounded-xl bg-[#EEF2ED] px-4 text-sm font-semibold text-[#4F6F52]">Clear filters</button>}
        </div>
      )}
      {[...groups].map(([date, group]) => (
        <section key={date} className="mb-7" aria-label={dateHeading(date === 'undated' ? null : date, today)}>
          <h2 className="mb-3 text-base font-semibold text-[#344C37]">{dateHeading(date === 'undated' ? null : date, today)}</h2>
          {date === 'undated' && <p className="mb-3 text-xs leading-relaxed text-[#595550]">These listings do not supply a confirmed event date. Check the flyer or organizer before attending.</p>}
          <div className="flex flex-col gap-5">
            {group.map(event => (
              <article key={event.id} className="overflow-hidden rounded-[1.5rem] border border-[#E7E2D8] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
                <Flyer event={event} />
                <div className="p-5">
                  <p className="mb-2 text-xs font-semibold text-[#4F6F52]">{event.source_name}</p>
                  <h3 className="mb-3 text-lg font-bold leading-snug text-[#242B25]">{event.title}</h3>
                  <div className="flex flex-col gap-2 text-sm text-[#595550]">
                    {event.event_time && <p className="flex items-start gap-2"><CalendarDays size={16} className="mt-0.5 shrink-0" /><span>{event.event_time}</span></p>}
                    {event.location && <p className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 shrink-0" /><span>{event.location}</span></p>}
                    {event.speakers && <p className="flex items-start gap-2"><Mic size={16} className="mt-0.5 shrink-0" /><span>{event.speakers}</span></p>}
                  </div>
                  {event.description && !/^tap (?:here )?to view/i.test(event.description) && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[#595550]">{event.description}</p>}
                  <p className="mt-4 text-xs leading-relaxed text-[#766243]">{freshnessLabel(event, now)}</p>
                  <a href={event.source_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#EEF2ED] px-4 text-sm font-semibold text-[#4F6F52]">Organizer details <ExternalLink size={14} /></a>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}
