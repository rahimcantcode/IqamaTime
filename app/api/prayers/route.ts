import { dallasDate, previousDate } from '@/lib/dallas-date'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key || url === 'your-supabase-url') {
    return NextResponse.json([])
  }

  try {
    const supabase = await createServerSupabaseClient()
    const today    = dallasDate()

    const { data: masjids, error: m } = await supabase
      .from('masjids')
      .select('*')
      .eq('active', true)
      .order('name')

    if (m) return NextResponse.json({ error: m.message }, { status: 500 })

    const yesterday = previousDate(today)
    const { data: prayerTimes, error: ptErr } = await supabase
      .from('prayer_times')
      .select('*')
      .in('date', [today, yesterday])

    if (ptErr) return NextResponse.json({ error: ptErr.message }, { status: 500 })

    const merged = (masjids ?? []).map(masjid => ({
      ...masjid,
      prayer_times:
        prayerTimes?.find(pt => pt.masjid_id === masjid.id && pt.date === today) ??
        prayerTimes?.find(pt => pt.masjid_id === masjid.id && pt.date === yesterday) ??
        null,
    }))

    return NextResponse.json(merged, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
