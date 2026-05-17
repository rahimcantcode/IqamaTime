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
      <span className="text-sm font-semibold tabular-nums text-white/20">
        {time}
      </span>
    )
  }
  return (
    <span
      className="inline-block rounded-full px-3 py-0.5 text-sm font-bold tabular-nums"
      style={{
        color:      accent,
        background: `${accent}18`,
        border:     `1px solid ${accent}28`,
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
      <div className="text-center py-8 text-white/20 text-sm">
        No iqama times available
      </div>
    )
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-1"
    >
      {sorted.map((entry) => {
        const hasBoth = isJummah && entry.iqama2

        return (
          <motion.div
            key={entry.masjid.id}
            variants={item}
            className={cn(
              'flex items-center justify-between px-4 py-3.5 rounded-2xl',
              entry.isPast ? 'opacity-35' : 'opacity-100'
            )}
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            {/* Masjid name + city */}
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-semibold text-gray-200 truncate leading-tight">
                {entry.masjid.name}
              </span>
              <span className="text-[0.7rem] text-white/30 leading-tight">
                {entry.masjid.city}
              </span>
            </div>

            {/* Time(s) */}
            <div className="flex flex-col items-end gap-1.5 ml-4 shrink-0">
              {entry.iqama ? (
                <TimePill time={entry.iqama} isPast={entry.isPast} accent={accentColor} />
              ) : (
                <span className="text-xs text-white/15">—</span>
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
