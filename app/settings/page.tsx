import { createServerSupabaseClient } from '@/lib/supabase-server'
import { MOCK_PRAYER_TIMES } from '@/lib/mock-data'
import { Masjid } from '@/types'
import SettingsPageClient from '@/components/settings-page-client'

function mockMasjids(): Masjid[] {
  return MOCK_PRAYER_TIMES.map((entry) => ({
    id: entry.id,
    name: entry.name,
    city: entry.city,
    website_url: entry.website_url,
    active: entry.active,
    created_at: entry.created_at,
  }))
}

async function getMasjids(): Promise<Masjid[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key || url === 'your-supabase-url') {
    return mockMasjids()
  }

  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('masjids')
      .select('*')
      .eq('active', true)
      .order('name')

    if (error || !data?.length) {
      return mockMasjids()
    }
    return data as Masjid[]
  } catch {
    return mockMasjids()
  }
}

export default async function SettingsPage() {
  const masjids = await getMasjids()
  return <SettingsPageClient masjids={masjids} />
}

export const revalidate = 3600
