import { Bell, Zap, Map, Clock } from 'lucide-react'

const PREVIEW_CARDS = [
  {
    icon: Bell,
    title: 'Iqama Reminders',
    description: 'Get notified before iqama starts at your favorite masjid.',
    accent: '#d4af37',
  },
  {
    icon: Map,
    title: 'Nearby Masjids',
    description: 'Discover masjids close to you with live iqama times.',
    accent: '#1ca094',
  },
  {
    icon: Clock,
    title: 'Prayer History',
    description: 'See how masjid times have changed over recent days.',
    accent: '#1ca094',
  },
  {
    icon: Zap,
    title: 'Live Updates',
    description: 'Masjids can push last-minute iqama changes directly to you.',
    accent: '#d4af37',
  },
]

export default function UpdatesPage() {
  return (
    <div
      className="fixed inset-0 flex flex-col bg-[#131925] overflow-y-auto scrollbar-none"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
    >
      {/* Header */}
      <div className="px-6 pt-2 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="w-5 h-5" style={{ color: '#1ca094' }} />
          <h1 className="text-xl font-bold text-white">Updates</h1>
        </div>
        <p className="text-xs text-white/30">What's new and what's coming</p>
      </div>

      {/* Coming soon banner */}
      <div className="mx-6 mt-6 rounded-2xl overflow-hidden">
        <div
          className="px-5 py-6 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(28,160,148,0.18) 0%, rgba(212,175,55,0.12) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 text-[0.65rem] font-bold tracking-[0.18em] uppercase"
            style={{ background: 'rgba(212,175,55,0.15)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.25)' }}
          >
            Coming Soon
          </div>
          <p className="text-base font-semibold text-white mb-1">Notifications & more</p>
          <p className="text-xs text-white/40 max-w-[260px] mx-auto">
            These features are actively being built. Stay tuned for updates.
          </p>
        </div>
      </div>

      {/* Feature preview cards */}
      <section className="px-6 pt-6 pb-32">
        <p className="text-[0.65rem] font-semibold tracking-[0.18em] uppercase text-white/30 mb-3">
          On the Roadmap
        </p>
        <div className="flex flex-col gap-3">
          {PREVIEW_CARDS.map(({ icon: Icon, title, description, accent }) => (
            <div
              key={title}
              className="flex items-start gap-4 px-4 py-4 rounded-2xl opacity-60"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: `${accent}18`, border: `1px solid ${accent}28` }}
              >
                <Icon className="w-4 h-4" style={{ color: accent }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white mb-0.5">{title}</p>
                <p className="text-xs text-white/40 leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
