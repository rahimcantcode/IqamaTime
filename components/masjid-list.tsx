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
  show: {
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0,  transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
}

function TimePill({ time, isPast, accent }: { time: string; isPast: boolean; accent: string }) {
  return (
    <span
      className={cn(
        'inline-block rounded-full px-3 py-0.5 text-sm font-semibold tabular-nums',
        isPast ? 'bg-white/5 text-white/30' : 'bg-white/10 text-white'
      )}
      style={isPast ? {} : { border: `1px solid ${accent}33` }}
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
      <div className="text-center py-8 text-white/30 text-sm">
        No iqama times available
      </div>
    )
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-0"
    >
      {sorted.map((entry, i) => {
        const hasBoth = isJummah && entry.iqama2
        const allPast = entry.isPast && (!hasBoth || compareTimesAsc(entry.iqama2 ?? null, null) < 0)

        return (
          <motion.div
            key={entry.masjid.id}
            variants={item}
            className={cn(
              'flex items-center justify-between px-4 py-3.5 rounded-2xl transition-colors',
              allPast ? 'opacity-40' : 'opacity-100',
              i % 2 === 0 ? 'bg-white/[0.03]' : ''
            )}
          >
            {/* Masjid name */}
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-medium text-white/90 truncate">
                {entry.masjid.name}
              </span>
              <span className="text-xs text-white/30">{entry.masjid.city}</span>
            </div>

            {/* Iqama time(s) */}
            <div className="flex flex-col items-end gap-1.5 ml-4 shrink-0">
              {entry.iqama && (
                <TimePill time={entry.iqama} isPast={entry.isPast} accent={accentColor} />
              )}
              {hasBoth && entry.iqama2 && (
                <TimePill time={entry.iqama2} isPast={false} accent={accentColor} />
              )}
              {!entry.iqama && (
                <span className="text-xs text-white/20">—</span>
              )}
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
