'use client'

import { useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { PrayerCardData } from '@/types'
import { PRAYER_GRADIENTS, PRAYER_GLOW, PRAYER_ACCENT } from '@/lib/prayer-utils'
import CountdownDisplay from './countdown-display'
import MasjidList from './masjid-list'

interface Props {
  data: PrayerCardData
  isActive: boolean
}

export default function PrayerCard({ data, isActive }: Props) {
  const { prayer, adhanTime, iqamaTimes, isFriday } = data
  const gradient  = PRAYER_GRADIENTS[prayer.key]
  const glow      = PRAYER_GLOW[prayer.key]
  const accent    = PRAYER_ACCENT[prayer.key]
  const isJummah  = prayer.key === 'jummah'

  const scrollRef  = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)

  const handleScroll = useCallback(() => {
    setScrolled((scrollRef.current?.scrollTop ?? 0) > 10)
  }, [])

  return (
    <div className={`w-full h-full flex flex-col bg-gradient-to-b ${gradient} overflow-hidden`}>
      {/* Ambient glow */}
      <div
        className="absolute inset-x-0 top-0 h-64 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${glow} 0%, transparent 70%)` }}
      />

      {/* Card content */}
      <div className="relative z-10 flex flex-col h-full">

        {/* Collapsible header — shrinks when user scrolls the iqama list */}
        <motion.div
          initial={false}
          animate={{ height: scrolled ? 0 : 'auto', opacity: scrolled ? 0 : 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 40 }}
          style={{ overflow: 'hidden' }}
        >
          {/* Prayer header */}
          <motion.div
            initial={false}
            animate={{ opacity: isActive ? 1 : 0.4 }}
            className="flex flex-col items-center pt-10 pb-6 px-6"
          >
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1,  y: 0   }}
              transition={{ delay: 0.1 }}
              className="text-2xl mb-1 font-light"
              style={{ color: `${accent}cc`, fontFamily: 'Georgia, serif', direction: 'rtl' }}
            >
              {prayer.arabicName}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1,  y: 0  }}
              transition={{ delay: 0.15 }}
              className="text-5xl font-bold text-white tracking-tight"
            >
              {prayer.displayName}
            </motion.h1>

            {adhanTime && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-2 text-sm font-medium tracking-widest uppercase"
                style={{ color: `${accent}88` }}
              >
                Adhan · {adhanTime}
              </motion.p>
            )}
          </motion.div>

          {/* Countdown */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1  }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="flex justify-center px-6 pb-8"
          >
            <CountdownDisplay targetTime={adhanTime} accentColor={accent} />
          </motion.div>

          {/* Divider */}
          <div
            className="mx-6 mb-4 h-px"
            style={{ background: `linear-gradient(to right, transparent, ${accent}33, transparent)` }}
          />
        </motion.div>

        {/* Masjid iqama list */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 pb-safe scrollbar-none"
        >
          <div className="flex items-center justify-between px-4 pb-3">
            <p className="text-xs font-semibold tracking-widest uppercase text-white/30">
              Iqama Times
            </p>
          </div>
          <MasjidList
            iqamaTimes={iqamaTimes}
            isJummah={isJummah}
            accentColor={accent}
          />
          <div className="h-4" />
        </div>
      </div>
    </div>
  )
}
