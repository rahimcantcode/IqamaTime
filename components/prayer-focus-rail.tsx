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

  useCurrentTime()

  const adhanPast = isTimePast(card.adhanTime)

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
      <div
        className="relative flex h-[318px] items-center justify-center overflow-hidden sm:h-[340px]"
        style={{ perspective: '1200px' }}
      >
        {/* Glow layer */}
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

        {/* Drag overlay */}
        <motion.div
          className="absolute inset-0 z-30 cursor-grab active:cursor-grabbing"
          data-page-swipe-ignore="true"
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
              className="absolute h-[252px] w-[184px] overflow-hidden rounded-[1.4rem] md:h-[290px] md:w-[218px]"
              style={{
                transformStyle: 'preserve-3d',
                zIndex: isCenter ? 20 : 10 - dist,
                boxShadow: isCenter
                  ? '0 20px 60px rgba(31,41,55,0.13), 0 6px 20px rgba(31,41,55,0.08)'
                  : '0 4px 14px rgba(31,41,55,0.07)',
              }}
              initial={false}
              animate={{
                x:       offset * 248,
                z:       -dist * 148,
                scale:   isCenter ? 1 : 0.82,
                rotateY: offset * -18,
                opacity: isCenter ? 1 : Math.max(0.15, 1 - dist * 0.42),
                filter:  `blur(${isCenter ? 0 : dist * 3}px) brightness(${isCenter ? 1 : 0.72})`,
              }}
              transition={SPRING}
              onClick={() => { if (offset !== 0) setActive(p => p + offset) }}
            >
              {/* Gradient base */}
              <div className={`absolute inset-0 bg-gradient-to-b ${PRAYER_GRADIENTS[c.prayer.key]}`} />

              {/* Subtle surface tint */}
              <div className="absolute inset-0 bg-white/30" />

              {/* Border */}
              <div
                className="absolute inset-0 rounded-[1.4rem]"
                style={{ border: '1px solid rgba(231,226,216,0.90)' }}
              />

              {/* Top rim highlight */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />

              {/* Content */}
              <div className="relative z-10 flex h-full flex-col items-center justify-center gap-2 px-5">
                <p
                  className="text-[1.65rem] leading-none"
                  style={{
                    fontFamily: 'Georgia, serif',
                    direction: 'rtl',
                    color: 'rgba(32,33,36,0.32)',
                  }}
                >
                  {c.prayer.arabicName}
                </p>

                <p
                  className="text-[1.45rem] font-bold leading-none tracking-tight"
                  style={{ color: '#202124' }}
                >
                  {c.prayer.displayName}
                </p>

                {c.adhanTime && (
                  <div className="mt-3 flex flex-col items-center gap-1">
                    <p
                      className="text-[0.58rem] font-semibold uppercase tracking-[0.18em]"
                      style={{ color: '#9CA3AF' }}
                    >
                      Adhan Time
                    </p>
                    <p
                      className="rounded-full px-3 py-1 text-sm font-bold tracking-[0.10em]"
                      style={{
                        color: PRAYER_ACCENT[c.prayer.key],
                        background: `${PRAYER_ACCENT[c.prayer.key]}14`,
                        border: `1px solid ${PRAYER_ACCENT[c.prayer.key]}30`,
                      }}
                    >
                      {c.adhanTime}
                    </p>
                  </div>
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
          className="rounded-full p-2 transition-colors active:scale-90"
          style={{ color: '#9CA3AF' }}
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
                  className="h-[5px] w-5 rounded-full transition-all duration-300"
                  style={{ background: '#C8A951' }}
                />
              ) : (
                <div
                  className="h-[5px] w-[5px] rounded-full"
                  style={{ background: 'rgba(32,33,36,0.15)' }}
                />
              )}
            </button>
          ))}
        </div>

        <button
          onClick={goNext}
          className="rounded-full p-2 transition-colors active:scale-90"
          style={{ color: '#9CA3AF' }}
          aria-label="Next prayer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── COUNTDOWN / STATUS ────────────────────────────── */}
      <div className="mx-6 mt-2 flex flex-col items-center gap-1.5 rounded-[1.35rem] px-4 py-5 iphone-panel">
        {!allIqamaPast && !adhanPast && (
          <p
            className="text-[0.65rem] font-semibold uppercase tracking-[0.18em]"
            style={{ color: '#9CA3AF' }}
          >
            Until Adhan
          </p>
        )}
        {allIqamaPast ? (
          <p
            className="text-sm font-semibold tracking-[0.18em] uppercase"
            style={{ color: '#9CA3AF' }}
          >
            Prayer Ended
          </p>
        ) : adhanPast ? (
          <div className="flex items-center gap-2.5">
            <span
              className="h-2 w-2 rounded-full animate-pulse"
              style={{ background: accent }}
            />
            <p className="text-base font-semibold" style={{ color: '#6B7280' }}>
              Adhan Called
            </p>
          </div>
        ) : (
          <CountdownDisplay targetTime={card.adhanTime} accentColor={accent} />
        )}
      </div>

      {/* ── SWIPEABLE IQAMA LIST ───────────────────────────── */}
      <div className="pb-28 pt-6">
        <p
          className="mb-3 px-7 text-[0.65rem] font-semibold uppercase tracking-[0.18em]"
          style={{ color: '#9CA3AF' }}
        >
          Iqama Times
        </p>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeIdx}
            data-page-swipe-ignore="true"
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
