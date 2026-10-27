import { dallasDate, previousDate } from '@/lib/dallas-date'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { MasjidWithPrayers } from '@/types'
import { fetchAdhanTimes } from '@/lib/adhan-times'
import Dashboard from '@/components/dashboard'

async function getPrayerData(): Promise<MasjidWithPrayers[]> {
  // Never invent prayer times when live data is unavailable.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key || url === 'your-supabase-url') return []

  try {
    const supabase = await createServerSupabaseClient()
    const today    = dallasDate()

    const { data: masjids, error: masjidErr } = await supabase
      .from('masjids')
      .select('*')
      .eq('active', true)
      .order('name')

    if (masjidErr || !masjids?.length) return []

    // Fetch both today and yesterday in one query; prefer today per-masjid,
    // fall back to yesterday for any masjid whose scraper hasn't run yet today.
    const yesterday = previousDate(today)
    const { data: prayerTimes, error: ptErr } = await supabase
      .from('prayer_times')
      .select('*')
      .in('date', [today, yesterday])

    if (ptErr) return []

    return masjids.map((masjid) => ({
      ...masjid,
      prayer_times:
        prayerTimes?.find(pt => pt.masjid_id === masjid.id && pt.date === today) ??
        prayerTimes?.find(pt => pt.masjid_id === masjid.id && pt.date === yesterday) ??
        null,
    }))
  } catch {
    return []
  }
}

export default async function HomePage() {
  const [data, adhanTimes] = await Promise.all([getPrayerData(), fetchAdhanTimes()])

  return <Dashboard data={data} adhanTimes={adhanTimes} />
}

// Read current prayer data on every page refresh.
export const dynamic = 'force-dynamic'
