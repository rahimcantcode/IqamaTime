'use client'

import { motion } from 'framer-motion'
import { MasjidIqamaTime } from '@/types'
import { compareTimesAsc } from '@/scrapers/normalizeTime'
import { cn } from '@/lib/utils'

interface Props {
  iqamaTimes: MasjidIqamaTime[]
  isJummah?: boolean
  accentColor: string
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 320, damping: 28 } },
}

function TimePill({
  time,
  isPast,
  accent,
}: {
  time: string
  isPast: boolean
  accent: string
}) {
  if (isPast) {
    return (
      <span className="text-sm font-semibold tabular-nums" style={{ color: '#9CA3AF' }}>
        {time}
      </span>
    )
  }
  return (
    <span
      className="inline-flex min-w-[76px] items-center justify-center rounded-full px-3 py-1 text-sm font-bold tabular-nums"
      style={{
        color:      accent,
        background: `${accent}14`,
        border:     `1px solid ${accent}30`,
      }}
    >
      {time}
    </span>
  )
}

export default function MasjidList({ iqamaTimes, isJummah = false, accentColor }: Props) {
  const sorted = [...iqamaTimes].sort((a, b) =>
    compareTimesAsc(a.iqama ?? null, b.iqama ?? null)
  )

  if (sorted.length === 0) {
    return (
      <div
        className="iphone-panel rounded-[1.25rem] py-8 text-center text-sm"
        style={{ color: '#9CA3AF' }}
      >
        No iqama times available
      </div>
    )
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-2"
    >
      {sorted.map((entry) => {
        const hasBoth = isJummah && entry.iqama2

        return (
          <motion.div
            key={entry.masjid.id}
            variants={item}
            className={cn(
              'pressable flex min-h-[68px] items-center justify-between rounded-[1.2rem] px-4 py-3.5',
              entry.isPast ? 'opacity-50' : 'opacity-100'
            )}
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(231,226,216,0.90)',
              boxShadow: '0 1px 4px rgba(31,41,55,0.05)',
            }}
          >
            {/* Masjid name + city */}
            <div className="flex min-w-0 flex-col gap-1 pr-2">
              <span
                className="truncate text-[0.92rem] font-semibold leading-tight"
                style={{ color: '#202124' }}
              >
                {entry.masjid.name}
              </span>
              <span
                className="text-[0.72rem] leading-tight"
                style={{ color: '#6B7280' }}
              >
                {entry.masjid.city}
              </span>
            </div>

            {/* Time(s) */}
            <div className="ml-4 flex shrink-0 flex-col items-end gap-1.5">
              {entry.iqama ? (
                <TimePill time={entry.iqama} isPast={entry.isPast} accent={accentColor} />
              ) : (
                <span className="text-xs" style={{ color: '#9CA3AF' }}>—</span>
              )}
              {hasBoth && entry.iqama2 && (
                <TimePill time={entry.iqama2} isPast={false} accent={accentColor} />
              )}
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
