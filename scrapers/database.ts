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
  sourceUrl?: string
}

/** Convenience type for time fields only */
export type TimesOnly = Pick<ScrapedPrayerTimes, 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'jummah1' | 'jummah2'>

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(url, key, {
    realtime: { transport: WebSocket as unknown as WebSocketLikeConstructor },
  })
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
    logger.error(data.masjidName, `Masjid not found in DB: ${masjidErr?.message}`)
    return
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
