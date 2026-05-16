'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings } from 'lucide-react'
import { formatTime, formatDate } from '@/lib/utils'
import { getHijriDate } from '@/lib/prayer-utils'
import { useCurrentTime } from '@/hooks/useCountdown'

interface Props {
  nextPrayerName: string
  nextPrayerTime: string | null
  onSettingsOpen: () => void
}

export default function AppHeader({ nextPrayerName, nextPrayerTime, onSettingsOpen }: Props) {
  const now      = useCurrentTime()
  const [hijri, setHijri] = useState('')

  useEffect(() => {
    setHijri(getHijriDate())
  }, [])

  const secondsUntil = nextPrayerTime
    ? Math.max(0, Math.floor((
        (() => {
          const d = new Date()
          const match = nextPrayerTime.match(/(\d+):(\d+)\s*(AM|PM)/i)
          if (!match) return d.getTime()
          let h = parseInt(match[1])
          const m = parseInt(match[2])
          const p = match[3].toUpperCase()
          if (p === 'PM' && h !== 12) h += 12
          if (p === 'AM' && h === 12) h = 0
          d.setHours(h, m, 0, 0)
          return d.getTime()
        })() - Date.now()
      ) / 1000))
    : 0

  const minutesUntil = Math.floor(secondsUntil / 60)

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex items-start justify-between px-6 pt-safe pb-4"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
    >
      {/* Left: dates & next prayer */}
      <div className="flex flex-col gap-0.5">
        <motion.p
          className="text-3xl font-bold text-white tabular-nums"
          key={formatTime(now)}
        >
          {formatTime(now)}
        </motion.p>
        <p className="text-xs text-white/50 font-medium">{formatDate(now)}</p>
        {hijri && (
          <p className="text-xs text-white/30">{hijri}</p>
        )}
        {nextPrayerName && (
          <div className="flex items-center gap-1.5 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-xs font-medium text-emerald-400">
              {nextPrayerName}
              {minutesUntil > 0 && ` · ${minutesUntil}m`}
            </p>
          </div>
        )}
      </div>

      {/* Right: settings */}
      <button
        onClick={onSettingsOpen}
        className="mt-1 p-2.5 rounded-2xl bg-white/5 active:bg-white/10 transition-colors"
        aria-label="Open settings"
      >
        <Settings className="w-5 h-5 text-white/60" />
      </button>
    </motion.header>
  )
}
