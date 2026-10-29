import { Bell } from 'lucide-react'
import { dallasDate } from '@/lib/dallas-date'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { epicRecurringEvents } from '@/data/epic-recurring-events'
import { prepareFeed, type FeedEvent } from '@/lib/updates/feed'
import UpdatesFeed from '@/components/updates-feed'
import BottomNav from '@/components/bottom-nav'

export const dynamic = 'force-dynamic'

export default async function UpdatesPage() {
  const now = new Date()
  const today = dallasDate(now)
  let events: FeedEvent[] = []
  let unavailable = false
  try {
    const supabase = await createServerSupabaseClient()
    const result = await supabase.from('community_events')
      .select('id,title,event_date,event_time,location,speakers,description,image_url,source_url,source_name,scraped_at,masjids(name)')
      .eq('active', true).or(`event_date.is.null,event_date.gte.${today}`)
      .order('event_date', { ascending: true, nullsFirst: false }).order('scraped_at', { ascending: false }).limit(250)
    if (result.error) unavailable = true
    else events = (result.data || []) as unknown as FeedEvent[]
  } catch { unavailable = true }

  const visible = prepareFeed([...events, ...epicRecurringEvents.map(event => ({ ...event, curated: true }))], today)
  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-[--background] px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[max(env(safe-area-inset-top),16px)]">
      <header className="pb-5 pt-2">
        <div className="mb-2 flex items-center gap-2"><Bell className="h-5 w-5 text-[#4F6F52]" /><h1 className="text-xl font-bold">Updates</h1></div>
        <p className="text-sm leading-relaxed text-[#595550]">Lectures, programs, and gatherings from local masjids. Times are Central; confirm details with the organizer.</p>
      </header>
      {unavailable && <p role="alert" className="mb-5 rounded-xl border border-[#E7D2A5] bg-[#FFF8E9] p-4 text-sm text-[#715522]">Live updates could not be loaded. Only saved recurring listings are shown; their schedules may have changed. Please check the organizer’s website.</p>}
      <UpdatesFeed events={visible} today={today} now={now.toISOString()} />
      <BottomNav />
    </main>
  )
}
