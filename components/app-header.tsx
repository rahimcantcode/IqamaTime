'use client'

import { useMemo, useState } from 'react'
import { Settings } from 'lucide-react'
import { cn, formatTime, formatDate } from '@/lib/utils'
import { getHijriDate, timeStrToDate } from '@/lib/prayer-utils'
import { useCurrentTime } from '@/hooks/useCountdown'

interface Props {
  nextPrayerName: string
  nextPrayerTime: string | null
  onSettingsOpen: () => void
}

export default function AppHeader({ nextPrayerName, nextPrayerTime, onSettingsOpen }: Props) {
  const now      = useCurrentTime()
  const [hijri] = useState(() => getHijriDate())

  const secondsUntil = useMemo(() => {
    if (!nextPrayerTime) return 0
    const target = timeStrToDate(nextPrayerTime)
    if (!target) return 0
    return Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000))
  }, [nextPrayerTime, now])

  const minutesUntil = Math.floor(secondsUntil / 60)

  return (
    <header
      className="relative z-30 flex items-start justify-between px-5 pb-3"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 14px)',
        background: 'linear-gradient(180deg, rgba(250,250,247,0.99) 0%, rgba(250,250,247,0.97) 75%, rgba(250,250,247,0.88) 100%)',
      }}
    >
      {/* Left: dates & next prayer */}
      <div className="flex min-w-0 flex-col gap-0.5">
        <p
          className="text-[2rem] font-bold leading-none tracking-tight tabular-nums"
          style={{ color: '#202124' }}
          suppressHydrationWarning
        >
          {formatTime(now)}
        </p>
        <p className="text-xs font-medium" style={{ color: '#6B7280' }} suppressHydrationWarning>
          {formatDate(now)}
        </p>
        {hijri && (
          <p className="text-xs" style={{ color: '#9CA3AF' }} suppressHydrationWarning>
            {hijri}
          </p>
        )}
        {nextPrayerName && (
          <div
            className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{ background: 'rgba(200,169,81,0.12)', border: '1px solid rgba(200,169,81,0.22)' }}
          >
            <div
              className="h-1.5 w-1.5 rounded-full animate-pulse"
              style={{ background: '#C8A951' }}
            />
            <p
              className="text-[0.68rem] font-bold tracking-wide"
              style={{ color: '#C8A951' }}
              suppressHydrationWarning
            >
              {nextPrayerName}
              {minutesUntil > 0 && ` · ${minutesUntil}m`}
            </p>
          </div>
        )}
      </div>

      {/* Right: settings button */}
      <button
        onClick={onSettingsOpen}
        className={cn(
          'mt-1 flex h-11 w-11 items-center justify-center rounded-2xl transition-colors active:scale-95',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8A951]'
        )}
        style={{
          background: 'rgba(31,41,55,0.05)',
          border: '1px solid rgba(31,41,55,0.08)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        aria-label="Open settings"
      >
        <Settings className="w-5 h-5" style={{ color: '#6B7280' }} />
      </button>
    </header>
  )
}
