'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import MasjidList from './masjid-list'
import CountdownDisplay from './countdown-display'
import { PrayerCardData } from '@/types'
import { PRAYER_ACCENT } from '@/lib/prayer-utils'

const CARD_GRADIENTS: Record<string, string> = {
  fajr:    'from-indigo-800/70 to-indigo-950',
  dhuhr:   'from-emerald-800/70 to-emerald-950',
  asr:     'from-amber-800/70 to-amber-950',
  maghrib: 'from-orange-800/70 to-orange-950',
  isha:    'from-violet-800/70 to-violet-950',
  jummah:  'from-emerald-700/70 to-emerald-950',
}

const SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const

function wrap(min: number, max: number, v: number) {
  const r = max - min
  return ((((v - min) % r) + r) % r) + min
}

interface Props {
  cards: PrayerCardData[]
  initialIndex: number
}

export default function PrayerFocusRail({ cards, initialIndex }: Props) {
  // Unbounded counter — wrap only for display so animations slide correctly
  const [active, setActive] = useState(initialIndex)
  const count    = cards.length
  const activeIdx = wrap(0, count, active)
  const card     = cards[activeIdx]
  const accent   = PRAYER_ACCENT[card.prayer.key]

  const goPrev = useCallback(() => setActive(p => p - 1), [])
  const goNext = useCallback(() => setActive(p => p + 1), [])

  const onDragEnd = useCallback((_: unknown, { offset, velocity }: PanInfo) => {
    const power = Math.abs(offset.x) * velocity.x
    if      (power < -8000) goNext()
    else if (power >  8000) goPrev()
  }, [goNext, goPrev])

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft')  goPrev()
    if (e.key === 'ArrowRight') goNext()
  }, [goPrev, goNext])

  return (
    <div className="flex flex-col outline-none" tabIndex={0} onKeyDown={onKeyDown}>

      {/* ── 3D CARD RAIL ──────────────────────────────────── */}
      <div
        className="relative h-[340px] flex items-center justify-center overflow-hidden"
        style={{ perspective: '1200px' }}
      >
        {/* Invisible drag overlay — covers the rail so drag works everywhere */}
        <motion.div
          className="absolute inset-0 z-30 cursor-grab active:cursor-grabbing"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={onDragEnd}
        />

        {[-2, -1, 0, 1, 2].map(offset => {
          const idx      = wrap(0, count, active + offset)
          const c        = cards[idx]
          const isCenter = offset === 0
          const dist     = Math.abs(offset)

          return (
            <motion.div
              key={active + offset}
              className="absolute w-[190px] h-[260px] md:w-[220px] md:h-[295px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
              style={{ transformStyle: 'preserve-3d', zIndex: isCenter ? 20 : 10 - dist }}
              initial={false}
              animate={{
                x:      offset * 270,
                z:      -dist * 150,
                scale:  isCenter ? 1 : 0.82,
                rotateY: offset * -18,
                opacity: isCenter ? 1 : Math.max(0.15, 1 - dist * 0.45),
                filter:  `blur(${isCenter ? 0 : dist * 5}px) brightness(${isCenter ? 1 : 0.5})`,
              }}
              transition={SPRING}
              onClick={() => { if (offset !== 0) setActive(p => p + offset) }}
            >
              {/* Gradient fill */}
              <div className={`w-full h-full bg-gradient-to-b ${CARD_GRADIENTS[c.prayer.key] ?? 'from-neutral-800 to-neutral-900'} flex flex-col items-center justify-center gap-3 px-4`}>
                <p
                  className="text-3xl opacity-50"
                  style={{ fontFamily: 'Georgia, serif', direction: 'rtl' }}
                >
                  {c.prayer.arabicName}
                </p>
                <p className="text-2xl font-bold text-white tracking-tight">
                  {c.prayer.displayName}
                </p>
                {c.adhanTime && (
                  <p className="text-xs tracking-widest uppercase text-white/40 mt-1">
                    {c.adhanTime}
                  </p>
                )}
              </div>

              {/* Top-edge highlight */}
              <div className="absolute inset-x-0 top-0 h-px bg-white/20 pointer-events-none" />
            </motion.div>
          )
        })}
      </div>

      {/* ── NAV BUTTONS ───────────────────────────────────── */}
      <div className="flex items-center justify-center gap-3 py-3">
        <button
          onClick={goPrev}
          className="rounded-full p-2 text-white/30 hover:text-white hover:bg-white/10 transition active:scale-95"
          aria-label="Previous prayer"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-xs font-mono text-white/20">{activeIdx + 1} / {count}</span>
        <button
          onClick={goNext}
          className="rounded-full p-2 text-white/30 hover:text-white hover:bg-white/10 transition active:scale-95"
          aria-label="Next prayer"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* ── COUNTDOWN ─────────────────────────────────────── */}
      <div className="flex justify-center py-6 border-t border-white/5">
        <CountdownDisplay targetTime={card.adhanTime} accentColor={accent} />
      </div>

      {/* ── SWIPEABLE IQAMA TIMES ─────────────────────────── */}
      <div className="pb-12">
        <div
          className="mb-3 h-px mx-8"
          style={{ background: `linear-gradient(to right, transparent, ${accent}33, transparent)` }}
        />
        <p className="text-xs font-semibold tracking-widest uppercase text-white/30 px-8 mb-3">
          Iqama Times
        </p>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeIdx}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragEnd={onDragEnd}
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.18 }}
            className="px-4 cursor-grab active:cursor-grabbing"
          >
            <MasjidList
              iqamaTimes={card.iqamaTimes}
              isJummah={card.prayer.key === 'jummah'}
              accentColor={accent}
            />
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  )
}
