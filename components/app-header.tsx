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
        <p className="text-3xl font-bold text-white tabular-nums tracking-tight">
          {formatTime(now)}
        </p>
        <p className="text-xs text-white/40 font-medium">{formatDate(now)}</p>
        {hijri && (
          <p className="text-xs text-white/22">{hijri}</p>
        )}
        {nextPrayerName && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: '#d4af37' }}
            />
            <p className="text-xs font-semibold" style={{ color: '#d4af37' }}>
              {nextPrayerName}
              {minutesUntil > 0 && ` · ${minutesUntil}m`}
            </p>
          </div>
        )}
      </div>

      {/* Right: settings — glass button */}
      <button
        onClick={onSettingsOpen}
        className="mt-1 p-2.5 rounded-2xl transition-colors active:scale-95"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        aria-label="Open settings"
      >
        <Settings className="w-5 h-5 text-white/45" />
      </button>
    </motion.header>
  )
}
