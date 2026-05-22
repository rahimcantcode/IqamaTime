import { createClient } from '@supabase/supabase-js'
import type { WebSocketLikeConstructor } from '@supabase/realtime-js'
import { logger } from './logger'
import WebSocket from 'ws'

export interface ScrapedPrayerTimes {
  masjidName: string
  date: string
  fajr:    string | null
  dhuhr:   string | null
  asr:     string | null
  maghrib: string | null
  isha:    string | null
  jummah1: string | null
  jummah2: string | null
  jummah3: string | null
  sourceUrl?: string
}

export interface ScrapedCommunityEvent {
  title: string
  eventDate: string | null
  eventTime: string | null
  location: string | null
  speakers: string | null
  description: string | null
  imageUrl: string | null
  sourceUrl: string
  sourceName: string
}

/** Convenience type for time fields only */
export type TimesOnly = Pick<ScrapedPrayerTimes, 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'jummah1' | 'jummah2' | 'jummah3'>

export function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(url, key, {
    realtime: { transport: WebSocket as unknown as WebSocketLikeConstructor },
  })
}

export async function ensureMasjid(input: {
  name: string
  city: string
  websiteUrl: string
}): Promise<string | null> {
  const supabase = getSupabase()

  // Upsert on name (requires masjids_name_unique constraint).
  // Always sets active=true so a previously-deactivated masjid is restored.
  const { data, error } = await supabase
    .from('masjids')
    .upsert(
      { name: input.name, city: input.city, website_url: input.websiteUrl, active: true },
      { onConflict: 'name', ignoreDuplicates: false }
    )
    .select('id')
    .single()

  if (error) {
    logger.error(input.name, `Masjid upsert failed: ${error.message}`)
    throw error
  }

  return data?.id ?? null
}

export async function replaceCommunityEventsForSource(input: {
  masjidName: string
  sourceName: string
  events: ScrapedCommunityEvent[]
}): Promise<void> {
  const supabase = getSupabase()

  const { data: masjid, error: masjidErr } = await supabase
    .from('masjids')
    .select('id')
    .eq('name', input.masjidName)
    .maybeSingle()

  if (masjidErr || !masjid) {
    logger.error(input.masjidName, `Masjid not found for events: ${masjidErr?.message}`)
    return
  }

  const { error: deleteErr } = await supabase
    .from('community_events')
    .delete()
    .eq('source_name', input.sourceName)

  if (deleteErr) {
    logger.error(input.sourceName, `Event cleanup failed: ${deleteErr.message}`)
    throw deleteErr
  }

  if (!input.events.length) return

  const rows = input.events.map(event => ({
    masjid_id: masjid.id,
    title: event.title,
    event_date: event.eventDate,
    event_time: event.eventTime,
    location: event.location,
    speakers: event.speakers,
    description: event.description,
    image_url: event.imageUrl,
    source_url: event.sourceUrl,
    source_name: event.sourceName,
    active: true,
  }))

  const { error: insertErr } = await supabase
    .from('community_events')
    .insert(rows)

  if (insertErr) {
    logger.error(input.sourceName, `Event insert failed: ${insertErr.message}`)
    throw insertErr
  }
}

export async function upsertPrayerTimes(data: ScrapedPrayerTimes): Promise<void> {
  // Skip entirely if we found no prayer times — don't overwrite good existing data
  const hasTimes = [data.fajr, data.dhuhr, data.asr, data.maghrib, data.isha].some(Boolean)
  if (!hasTimes) {
    logger.warn(data.masjidName, 'No prayer times found — skipping DB write to preserve existing data')
    return
  }

  const supabase = getSupabase()

  // Find masjid by name
  const { data: masjid, error: masjidErr } = await supabase
    .from('masjids')
    .select('id')
    .eq('name', data.masjidName)
    .single()

  if (masjidErr || !masjid) {
    const msg = `Masjid not found in DB: ${masjidErr?.message ?? 'no row returned'}`
    logger.error(data.masjidName, msg)
    throw new Error(msg)
  }

  const { error } = await supabase.from('prayer_times').upsert(
    {
      masjid_id:  masjid.id,
      date:       data.date,
      fajr:       data.fajr,
      dhuhr:      data.dhuhr,
      asr:        data.asr,
      maghrib:    data.maghrib,
      isha:       data.isha,
      jummah1:    data.jummah1,
      jummah2:    data.jummah2,
      jummah3:    data.jummah3,
      scraped_at: new Date().toISOString(),
      source_url: data.sourceUrl ?? null,
    },
    { onConflict: 'masjid_id,date' }
  )

  if (error) {
    logger.error(data.masjidName, `DB upsert failed: ${error.message}`)
    throw error
  }
}

export async function logScrape(
  masjidName: string,
  success: boolean,
  durationMs: number,
  error?: string
): Promise<void> {
  try {
    const supabase = getSupabase()
    const { data: masjid } = await supabase
      .from('masjids')
      .select('id')
      .eq('name', masjidName)
      .maybeSingle()

    await supabase.from('scrape_logs').insert({
      masjid_id:   masjid?.id ?? null,
      success,
      duration_ms: durationMs,
      error:       error ?? null,
    })
  } catch {
    // Non-critical
  }
}

export function todayDate(): string {
  return new Date().toISOString().split('T')[0]
}
