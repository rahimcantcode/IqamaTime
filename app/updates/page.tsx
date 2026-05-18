import { Bell, CalendarDays, MapPin, Mic } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function UpdatesPage() {
  const supabase = await createServerSupabaseClient()

  const { data: events } = await supabase
    .from('community_events')
    .select(`
      id,
      title,
      event_date,
      event_time,
      location,
      speakers,
      description,
      image_url,
      source_url,
      source_name,
      masjids(name)
    `)
    .eq('active', true)
    .order('event_date', { ascending: true })
    .limit(25)

  return (
    <div
      className="fixed inset-0 overflow-y-auto bg-[#FAFAF7] pb-28"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
    >
      <div className="px-6 pb-4 pt-2">
        <div className="mb-1 flex items-center gap-2">
          <Bell className="h-5 w-5" style={{ color: '#4F6F52' }} />
          <h1 className="text-xl font-bold text-[#202124]">Updates</h1>
        </div>

        <p className="text-xs text-[#6B7280]">
          Community lectures, seminars, and gatherings from supported masjids.
        </p>
      </div>

      <section className="flex flex-col gap-5 px-5 pb-24">
        {!events?.length && (
          <div
            className="rounded-[1.5rem] border border-[#E7E2D8] bg-white px-5 py-8 text-center"
            style={{ boxShadow: '0 4px 16px rgba(15,23,42,0.05)' }}
          >
            <p className="mb-1 text-base font-semibold text-[#202124]">
              No upcoming events yet
            </p>
            <p className="text-sm text-[#6B7280]">
              The weekly community feed refreshes automatically.
            </p>
          </div>
        )}

        {events?.map((event: any) => (
          <a
            key={event.id}
            href={event.source_url}
            target="_blank"
            rel="noreferrer"
            className="overflow-hidden rounded-[1.6rem] border border-[#E7E2D8] bg-white"
            style={{ boxShadow: '0 6px 24px rgba(15,23,42,0.06)' }}
          >
            {event.image_url ? (
              <div className="relative aspect-[1.35/1] w-full overflow-hidden bg-[#F3F4F6]">
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="h-full w-full object-cover"
                />

                <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/55 px-3 py-1 text-[0.68rem] font-semibold text-white backdrop-blur-sm">
                  {event.source_name}
                </div>
              </div>
            ) : (
              <div className="flex h-28 items-center justify-center bg-[#EEF2ED]">
                <div className="rounded-full bg-[#4F6F52]/10 px-4 py-2 text-sm font-medium text-[#4F6F52]">
                  {event.source_name}
                </div>
              </div>
            )}

            <div className="px-5 py-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-bold leading-tight text-[#202124]">
                    {event.title}
                  </p>

                  {event.masjids?.name && (
                    <p className="mt-1 text-sm font-medium text-[#4F6F52]">
                      {event.masjids.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="mb-4 flex flex-col gap-2 text-sm text-[#6B7280]">
                {(event.event_date || event.event_time) && (
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-[#C8A951]" />
                    <span>
                      {[event.event_date, event.event_time].filter(Boolean).join(' • ')}
                    </span>
                  </div>
                )}

                {event.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#C8A951]" />
                    <span>{event.location}</span>
                  </div>
                )}

                {event.speakers && (
                  <div className="flex items-center gap-2">
                    <Mic className="h-4 w-4 text-[#C8A951]" />
                    <span>{event.speakers}</span>
                  </div>
                )}
              </div>

              {event.description && (
                <p className="line-clamp-4 text-sm leading-relaxed text-[#4B5563]">
                  {event.description}
                </p>
              )}
            </div>
          </a>
        ))}
      </section>
    </div>
  )
}
