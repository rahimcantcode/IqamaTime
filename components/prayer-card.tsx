'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { PrayerCardData } from '@/types'
import { PRAYER_GRADIENTS, PRAYER_GLOW, PRAYER_ACCENT } from '@/lib/prayer-utils'
import CountdownDisplay from './countdown-display'
import MasjidList from './masjid-list'

interface Props {
  data: PrayerCardData
  isActive: boolean
}

export default function PrayerCard({ data, isActive }: Props) {
  const { prayer, adhanTime, iqamaTimes } = data
  const gradient = PRAYER_GRADIENTS[prayer.key]
  const glow     = PRAYER_GLOW[prayer.key]
  const accent   = PRAYER_ACCENT[prayer.key]
  const isJummah = prayer.key === 'jummah'

  // Track scroll within the single card scroll container
  const scrollRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll({ container: scrollRef })

  // Fade the header out as user scrolls — no jarring toggle
  const headerOpacity = useTransform(scrollY, [0, 100], [1, 0])

  return (
    <div className={`relative w-full h-full flex flex-col bg-gradient-to-b ${gradient} overflow-hidden`}>
      {/* Calligraphy background */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'url(/calligraphy-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.08,
          mixBlendMode: 'luminosity',
        }}
      />

      {/* Ambient glow */}
      <div
        className="absolute inset-x-0 top-0 h-64 pointer-events-none z-0"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${glow} 0%, transparent 70%)` }}
      />

      {/* Single scroll container — header scrolls away, label sticks */}
      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto scrollbar-none">

        {/* Header — fades and scrolls away naturally */}
        <motion.div
          style={{ opacity: headerOpacity }}
          animate={{ opacity: isActive ? undefined : 0.4 }}
        >
          <div className="flex flex-col items-center pt-10 pb-6 px-6">
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl mb-1 font-light"
              style={{ color: `${accent}cc`, fontFamily: 'Georgia, serif', direction: 'rtl' }}
            >
              {prayer.arabicName}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
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
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="flex justify-center px-6 pb-8"
          >
            <CountdownDisplay targetTime={adhanTime} accentColor={accent} />
          </motion.div>
        </motion.div>

        {/* Sticky "Iqama Times" label — stays at top once header scrolls away */}
        <div
          className="sticky top-0 z-10 px-8 pt-2 pb-3"
          style={{ background: `linear-gradient(to bottom, #080810ee, #08081099)`, backdropFilter: 'blur(8px)' }}
        >
          <div
            className="mb-3 h-px"
            style={{ background: `linear-gradient(to right, transparent, ${accent}33, transparent)` }}
          />
          <p className="text-xs font-semibold tracking-widest uppercase text-white/30">
            Iqama Times
          </p>
        </div>

        {/* Masjid list */}
        <div className="px-4 pb-4">
          <MasjidList
            iqamaTimes={iqamaTimes}
            isJummah={isJummah}
            accentColor={accent}
          />
        </div>

        <div className="h-4" />
      </div>
    </div>
  )
}
