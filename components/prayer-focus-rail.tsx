'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import MasjidList from './masjid-list'
import CountdownDisplay from './countdown-display'
import { PrayerCardData } from '@/types'
import { PRAYER_ACCENT, PRAYER_GRADIENTS, PRAYER_GLOW, timeStrToDate } from '@/lib/prayer-utils'
import { useCurrentTime } from '@/hooks/useCountdown'
import { compareTimesAsc } from '@/scrapers/normalizeTime'

function isTimePast(timeStr: string | null): boolean {
  if (!timeStr) return false
  const target = timeStrToDate(timeStr.replace(/^~/, ''))
  return !!target && target.getTime() < Date.now()
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
  const [active, setActive] = useState(initialIndex)
  const count    = cards.length
  const activeIdx = wrap(0, count, active)
  const card     = cards[activeIdx]
  const accent   = PRAYER_ACCENT[card.prayer.key]
  const glow     = PRAYER_GLOW[card.prayer.key]

  // Re-render every second so adhan/iqama state stays live
  useCurrentTime()

  const adhanPast = isTimePast(card.adhanTime)

  // Latest iqama across all masjids for this prayer
  const latestIqama = card.iqamaTimes
    .map(t => t.iqama)
    .filter((t): t is string => !!t)
    .sort((a, b) => compareTimesAsc(b, a))[0] ?? null

  const allIqamaPast = isTimePast(latestIqama)

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
    <div
      className="flex flex-col outline-none"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      {/* ── AMBIENT GLOW ──────────────────────────────────── */}
      <div className="relative flex h-[318px] items-center justify-center overflow-hidden sm:h-[340px]"
        style={{ perspective: '1200px' }}>

        {/* Glow layer — transitions between prayers */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`glow-${activeIdx}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            className="absolute inset-0 pointer-events-none flex items-start justify-center"
          >
            <div
              className="w-[80%] h-72 rounded-full blur-3xl"
              style={{ background: `radial-gradient(ellipse, ${glow} 0%, transparent 70%)` }}
            />
          </motion.div>
        </AnimatePresence>

        {/* ── DRAG OVERLAY (captures swipe anywhere on the rail) ── */}
        <motion.div
          className="absolute inset-0 z-30 cursor-grab active:cursor-grabbing"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={onDragEnd}
        />

        {/* ── 3D CARD RAIL ──────────────────────────────────── */}
        {[-2, -1, 0, 1, 2].map(offset => {
          const idx      = wrap(0, count, active + offset)
          const c        = cards[idx]
          const isCenter = offset === 0
          const dist     = Math.abs(offset)

          return (
            <motion.div
              key={active + offset}
            className="absolute h-[252px] w-[184px] overflow-hidden rounded-[1.4rem] shadow-2xl md:h-[290px] md:w-[218px]"
              style={{
                transformStyle: 'preserve-3d',
                zIndex: isCenter ? 20 : 10 - dist,
                boxShadow: isCenter
                  ? `0 24px 80px ${PRAYER_ACCENT[c.prayer.key]}18, 0 18px 38px rgba(0,0,0,0.36)`
                  : '0 14px 34px rgba(0,0,0,0.24)',
              }}
              initial={false}
              animate={{
                x:       offset * 248,
                z:       -dist * 148,
                scale:   isCenter ? 1 : 0.82,
                rotateY: offset * -18,
                opacity: isCenter ? 1 : Math.max(0.12, 1 - dist * 0.44),
                filter:  `blur(${isCenter ? 0 : dist * 4}px) brightness(${isCenter ? 1 : 0.45})`,
              }}
              transition={SPRING}
              onClick={() => { if (offset !== 0) setActive(p => p + offset) }}
            >
              {/* Gradient base */}
              <div className={`absolute inset-0 bg-gradient-to-b ${PRAYER_GRADIENTS[c.prayer.key]}`} />

              {/* Glass overlay */}
              <div
                className="absolute inset-0 bg-white/[0.045]"
                style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
              />

              {/* Border */}
              <div className="absolute inset-0 rounded-[1.4rem] border border-white/[0.12]" />

              {/* Top rim light */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

              {/* Content */}
              <div className="relative z-10 flex h-full flex-col items-center justify-center gap-2 px-5">
                <p
                  className="text-[1.65rem] leading-none"
                  style={{
                    fontFamily: 'Georgia, serif',
                    direction: 'rtl',
                    color: 'rgba(255,255,255,0.38)',
                  }}
                >
                  {c.prayer.arabicName}
                </p>

                <p className="text-[1.45rem] font-bold leading-none tracking-tight text-white">
                  {c.prayer.displayName}
                </p>

                {c.adhanTime && (
                  <p
                    className="mt-2 rounded-full px-3 py-1 text-sm font-bold tracking-[0.12em] uppercase"
                    style={{
                      color: PRAYER_ACCENT[c.prayer.key],
                      background: `${PRAYER_ACCENT[c.prayer.key]}14`,
                      border: `1px solid ${PRAYER_ACCENT[c.prayer.key]}22`,
                      opacity: 0.95,
                    }}
                  >
                    {c.adhanTime}
                  </p>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* ── DOT INDICATORS + CHEVRONS ─────────────────────── */}
      <div className="mx-auto flex w-[82vw] max-w-[420px] items-center justify-between pb-1 pt-1">
        <button
          onClick={goPrev}
          className="rounded-full p-2 text-white/24 transition-colors hover:text-white/55 active:scale-90"
          aria-label="Previous prayer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={cards[i].prayer.displayName}
              className="flex min-h-9 min-w-9 items-center justify-center transition-all duration-300"
            >
              {i === activeIdx ? (
                <div
                  className="w-5 h-[5px] rounded-full transition-all duration-300"
                  style={{ background: '#d4af37' }}
                />
              ) : (
                <div className="w-[5px] h-[5px] rounded-full bg-white/20" />
              )}
            </button>
          ))}
        </div>

        <button
          onClick={goNext}
          className="rounded-full p-2 text-white/24 transition-colors hover:text-white/55 active:scale-90"
          aria-label="Next prayer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── COUNTDOWN / STATUS ────────────────────────────── */}
      <div className="mx-6 mt-2 flex flex-col items-center gap-1.5 rounded-[1.35rem] px-4 py-5 iphone-panel">
        {!allIqamaPast && !adhanPast && (
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/32">
            Time Remaining
          </p>
        )}
        {allIqamaPast ? (
          /* All iqama times have passed — prayer window closed */
          <p className="text-sm font-semibold tracking-[0.18em] uppercase text-white/25">
            Prayer Ended
          </p>
        ) : adhanPast ? (
          /* Adhan called, iqama still upcoming */
          <div className="flex items-center gap-2.5">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: accent }}
            />
            <p className="text-base font-semibold text-white/70">
              Adhan Called
            </p>
          </div>
        ) : (
          /* Countdown to adhan */
          <CountdownDisplay targetTime={card.adhanTime} accentColor={accent} />
        )}
      </div>

      {/* ── SWIPEABLE IQAMA LIST ───────────────────────────── */}
      <div className="pb-28 pt-6">
        <p className="mb-3 px-7 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/32">
          Iqama Times
        </p>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeIdx}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragEnd={onDragEnd}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.18 }}
            className="cursor-grab px-4 active:cursor-grabbing"
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
