import { createServerSupabaseClient } from '@/lib/supabase-server'
import { MOCK_PRAYER_TIMES } from '@/lib/mock-data'
import { MasjidWithPrayers } from '@/types'
import { fetchAdhanTimes } from '@/lib/adhan-times'
import Dashboard from '@/components/dashboard'

async function getPrayerData(): Promise<MasjidWithPrayers[]> {
  // Try Supabase first; fall back to mock data if env vars not set or query fails
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key || url === 'your-supabase-url') return MOCK_PRAYER_TIMES

  try {
    const supabase = await createServerSupabaseClient()
    const today    = new Date().toISOString().split('T')[0]

    const { data: masjids, error: masjidErr } = await supabase
      .from('masjids')
      .select('*')
      .eq('active', true)
      .order('name')

    if (masjidErr || !masjids?.length) return MOCK_PRAYER_TIMES

    // Fetch both today and yesterday in one query; prefer today per-masjid,
    // fall back to yesterday for any masjid whose scraper hasn't run yet today.
    const yesterday = new Date(Date.now() - 864e5).toISOString().split('T')[0]
    const { data: prayerTimes, error: ptErr } = await supabase
      .from('prayer_times')
      .select('*')
      .in('date', [today, yesterday])

    if (ptErr) return MOCK_PRAYER_TIMES

    return masjids.map((masjid) => ({
      ...masjid,
      prayer_times:
        prayerTimes?.find(pt => pt.masjid_id === masjid.id && pt.date === today) ??
        prayerTimes?.find(pt => pt.masjid_id === masjid.id && pt.date === yesterday) ??
        null,
    }))
  } catch {
    return MOCK_PRAYER_TIMES
  }
}

export default async function HomePage() {
  const [data, adhanTimes] = await Promise.all([getPrayerData(), fetchAdhanTimes()])

  return <Dashboard data={data} adhanTimes={adhanTimes} />
}

// Revalidate data every 30 minutes
export const revalidate = 1800
