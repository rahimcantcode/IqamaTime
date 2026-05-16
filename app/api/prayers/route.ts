import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { MOCK_PRAYER_TIMES } from '@/lib/mock-data'

export const dynamic = 'force-dynamic'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key || url === 'your-supabase-url') {
    return NextResponse.json(MOCK_PRAYER_TIMES)
  }

  try {
    const supabase = await createServerSupabaseClient()
    const today    = new Date().toISOString().split('T')[0]

    const { data: masjids, error: m } = await supabase
      .from('masjids')
      .select('*')
      .eq('active', true)
      .order('name')

    if (m) return NextResponse.json({ error: m.message }, { status: 500 })

    const yesterday = new Date(Date.now() - 864e5).toISOString().split('T')[0]
    let { data: prayerTimes, error: p } = await supabase
      .from('prayer_times')
      .select('*')
      .eq('date', today)

    if (p) return NextResponse.json({ error: p.message }, { status: 500 })

    if (!prayerTimes?.length) {
      ;({ data: prayerTimes } = await supabase.from('prayer_times').select('*').eq('date', yesterday))
    }

    const merged = (masjids ?? []).map(masjid => ({
      ...masjid,
      prayer_times: prayerTimes?.find(pt => pt.masjid_id === masjid.id) ?? null,
    }))

    return NextResponse.json(merged, {
      headers: { 'Cache-Control': 's-maxage=1800, stale-while-revalidate=300' },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
