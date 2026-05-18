'use client'

import { useRouter } from 'next/navigation'
import {
  Sparkles, Sun, Moon, Heart, Star, Clock, Navigation,
  LogIn, LogOut, Compass, Shield, Plane, Mic, MessageCircle, Sunset,
  type LucideIcon,
} from 'lucide-react'
import { DHIKR_HERO_CARD, DHIKR_SECTIONS, type DhikrCard } from '@/lib/dhikr-data'

const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles, Sun, Moon, Heart, Star, Clock, Navigation,
  LogIn, LogOut, Compass, Shield, Plane, Mic, MessageCircle, Sunset,
}

function SectionCard({ card, onClick }: { card: DhikrCard; onClick: () => void }) {
  const Icon = ICON_MAP[card.icon] ?? Heart
  return (
    <button
      type="button"
      onClick={onClick}
      className="pressable flex flex-col gap-3 rounded-[1.2rem] p-4 text-left"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E7E2D8',
        boxShadow: '0 1px 4px rgba(31,41,55,0.05)',
        minHeight: 120,
      }}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
        style={{ background: 'rgba(200,169,81,0.12)', border: '1px solid rgba(200,169,81,0.22)' }}
      >
        <Icon className="h-4 w-4" style={{ color: '#C8A951' }} />
      </div>
      <div>
        <p className="text-sm font-semibold leading-snug" style={{ color: '#202124' }}>{card.title}</p>
        <p className="mt-0.5 text-[0.6rem] leading-relaxed" style={{ color: '#9CA3AF' }}>{card.description}</p>
      </div>
    </button>
  )
}

export default function DhikrPage() {
  const router = useRouter()
  const HeroIcon = ICON_MAP[DHIKR_HERO_CARD.icon] ?? Sparkles

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-y-auto bg-[#FAFAF7] scrollbar-none scroll-momentum"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
    >
      {/* Header */}
      <div className="px-6 pb-2 pt-2">
        <div className="mb-1 flex items-center gap-2">
          <Sparkles className="h-5 w-5" style={{ color: '#C8A951' }} />
          <h1 className="text-xl font-bold" style={{ color: '#202124' }}>Dhikr</h1>
        </div>
        <p className="text-xs" style={{ color: '#6B7280' }}>A quiet space for remembrance around salah.</p>
        <p className="mt-0.5 text-[0.6rem]" style={{ color: '#9CA3AF' }}>Curated essentials for prayer, masjid, and daily remembrance.</p>
      </div>

      <div className="flex-1 px-6 pb-32 pt-5">

        {/* ── HERO CARD ─────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => router.push('/dhikr/post-salah')}
          className="pressable mb-6 w-full rounded-[1.75rem] p-5 text-left"
          style={{
            background: 'linear-gradient(135deg, rgba(200,169,81,0.11) 0%, rgba(143,174,147,0.09) 100%)',
            border: '1px solid rgba(200,169,81,0.28)',
            boxShadow: '0 4px 28px rgba(200,169,81,0.14)',
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p
                className="mb-1 text-[0.58rem] font-bold uppercase tracking-[0.20em]"
                style={{ color: '#C8A951' }}
              >
                Featured
              </p>
              <h2 className="mb-1 text-xl font-bold leading-tight" style={{ color: '#202124' }}>
                {DHIKR_HERO_CARD.title}
              </h2>
              <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>
                {DHIKR_HERO_CARD.description}
              </p>
            </div>
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
              style={{
                background: 'rgba(200,169,81,0.14)',
                border: '1px solid rgba(200,169,81,0.28)',
              }}
            >
              <HeroIcon className="h-5 w-5" style={{ color: '#C8A951' }} />
            </div>
          </div>

          <div className="mt-4">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold"
              style={{
                background: 'rgba(200,169,81,0.16)',
                border: '1px solid rgba(200,169,81,0.32)',
                color: '#C8A951',
              }}
            >
              Start →
            </span>
          </div>
        </button>

        {/* ── SECTIONS ──────────────────────────────────────── */}
        {DHIKR_SECTIONS.map(section => (
          <section key={section.title} className="mb-7">
            <p
              className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.18em]"
              style={{ color: '#9CA3AF' }}
            >
              {section.title}
            </p>

            <div className="grid grid-cols-2 gap-3">
              {section.cards.map((card, i) => {
                const isOddLast = section.cards.length % 2 !== 0 && i === section.cards.length - 1
                return (
                  <div key={card.id} className={isOddLast ? 'col-span-2' : ''}>
                    <SectionCard
                      card={card}
                      onClick={() => router.push(`/dhikr/${card.id}`)}
                    />
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
