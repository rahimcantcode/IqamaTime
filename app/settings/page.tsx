import { createServerSupabaseClient } from '@/lib/supabase-server'
import { MOCK_PRAYER_TIMES } from '@/lib/mock-data'
import { Masjid } from '@/types'
import SettingsPageClient from '@/components/settings-page-client'

async function getMasjids(): Promise<Masjid[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key || url === 'your-supabase-url') {
    return MOCK_PRAYER_TIMES.map(({ prayer_times: _, ...m }) => m as Masjid)
  }

  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('masjids')
      .select('*')
      .eq('active', true)
      .order('name')

    if (error || !data?.length) {
      return MOCK_PRAYER_TIMES.map(({ prayer_times: _, ...m }) => m as Masjid)
    }
    return data as Masjid[]
  } catch {
    return MOCK_PRAYER_TIMES.map(({ prayer_times: _, ...m }) => m as Masjid)
  }
}

export default async function SettingsPage() {
  const masjids = await getMasjids()
  return <SettingsPageClient masjids={masjids} />
}

export const revalidate = 3600
