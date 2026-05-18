import { Bell, Zap, Map, Clock } from 'lucide-react'

const PREVIEW_CARDS = [
  {
    icon: Bell,
    title: 'Iqama Reminders',
    description: 'Get notified before iqama starts at your favorite masjid.',
    accent: '#C8A951',
  },
  {
    icon: Map,
    title: 'Nearby Masjids',
    description: 'Discover masjids close to you with live iqama times.',
    accent: '#4F6F52',
  },
  {
    icon: Clock,
    title: 'Prayer History',
    description: 'See how masjid times have changed over recent days.',
    accent: '#4F6F52',
  },
  {
    icon: Zap,
    title: 'Live Updates',
    description: 'Masjids can push last-minute iqama changes directly to you.',
    accent: '#C8A951',
  },
]

export default function UpdatesPage() {
  return (
    <div
      className="fixed inset-0 flex flex-col overflow-y-auto bg-[#FAFAF7] scrollbar-none scroll-momentum"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
    >
      {/* Header */}
      <div className="px-6 pb-2 pt-2">
        <div className="mb-1 flex items-center gap-2">
          <Bell className="w-5 h-5" style={{ color: '#4F6F52' }} />
          <h1 className="text-xl font-bold" style={{ color: '#202124' }}>Updates</h1>
        </div>
        <p className="text-xs" style={{ color: '#6B7280' }}>What&apos;s new and what&apos;s coming</p>
      </div>

      {/* Coming soon banner */}
      <div className="mx-6 mt-6 overflow-hidden rounded-[1.35rem]">
        <div
          className="px-5 py-7 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(143,174,147,0.15) 0%, rgba(200,169,81,0.10) 100%)',
            border: '1px solid #E7E2D8',
          }}
        >
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em]"
            style={{ background: 'rgba(200,169,81,0.14)', color: '#C8A951', border: '1px solid rgba(200,169,81,0.28)' }}
          >
            Coming Soon
          </div>
          <p className="mb-1 text-base font-semibold" style={{ color: '#202124' }}>Notifications &amp; more</p>
          <p className="mx-auto max-w-[260px] text-xs" style={{ color: '#6B7280' }}>
            These features are actively being built. Stay tuned for updates.
          </p>
        </div>
      </div>

      {/* Feature preview cards */}
      <section className="px-6 pb-32 pt-6">
        <p className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.18em]" style={{ color: '#9CA3AF' }}>
          On the Roadmap
        </p>
        <div className="flex flex-col gap-3">
          {PREVIEW_CARDS.map(({ icon: Icon, title, description, accent }) => (
            <div
              key={title}
              className="flex items-start gap-4 rounded-[1.2rem] px-4 py-4 opacity-65"
              style={{ background: '#FFFFFF', border: '1px solid #E7E2D8', boxShadow: '0 1px 4px rgba(31,41,55,0.05)' }}
            >
              <div
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `${accent}14`, border: `1px solid ${accent}28` }}
              >
                <Icon className="w-4 h-4" style={{ color: accent }} />
              </div>
              <div>
                <p className="mb-0.5 text-sm font-semibold" style={{ color: '#202124' }}>{title}</p>
                <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
