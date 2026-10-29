'use client'

import { motion } from 'framer-motion'
import { Navigation } from 'lucide-react'
import { MasjidIqamaTime } from '@/types'
import { compareTimesAsc } from '@/scrapers/normalizeTime'
import { dallasMinutes } from '@/lib/dallas-date'
import { cn } from '@/lib/utils'

const MASJID_LABELS: Record<string, { short: string; full: string }> = {
  'EPIC Masjid':                          { short: 'EPIC',   full: 'East Plano Islamic Center' },
  'IANT':                                 { short: 'IANT',   full: 'Islamic Association of North Texas' },
  'Islamic Center of Rowlett':            { short: 'ICR',    full: 'Islamic Center of Rowlett' },
  'SMS Masjid of Sachse':                 { short: 'SMS',    full: 'Sachse Muslim Society' },
  'Valley Ranch Islamic Center':          { short: 'VRIC',   full: 'Valley Ranch Islamic Center' },
  'Qalam Masjid':                          { short: 'Qalam', full: 'Qalam Masjid' },
  'Qalam Institute':                      { short: 'Qalam',  full: 'Qalam Institute' },
  'Islamic Association of Collin County': { short: 'IACC',   full: 'Islamic Association of Collin County' },
  'Masjid Yaseen':                        { short: 'Yaseen', full: 'Masjid Yaseen' },
  'American Imams Academy':               { short: 'AIA',    full: 'American Imams Academy' },
  'Islamic Center of Irving':             { short: 'ICI',    full: 'Islamic Center of Irving' },
  'Islamic Association of Allen':         { short: 'IAA',    full: 'Islamic Association of Allen' },
  'McKinney Islamic Association':         { short: 'MIA',    full: 'McKinney Islamic Association' },
  'Islamic Center of Frisco':             { short: 'ICF',    full: 'Islamic Center of Frisco' },
  'MAS Dallas':                           { short: 'MAS',    full: 'Muslim American Society Dallas' },
}

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
      <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--text-muted)' }}>
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

function isTimePast(timeStr: string | null | undefined): boolean {
  if (!timeStr) return false
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!match) return false
  let h = parseInt(match[1], 10)
  const m = parseInt(match[2], 10)
  if (match[3].toUpperCase() === 'PM' && h !== 12) h += 12
  if (match[3].toUpperCase() === 'AM' && h === 12) h = 0
  const now = new Date()
  return h * 60 + m < dallasMinutes(now)
}

export default function MasjidList({ iqamaTimes, isJummah = false, accentColor }: Props) {
  const sorted = [...iqamaTimes].sort((a, b) =>
    compareTimesAsc(a.iqama ?? null, b.iqama ?? null)
  )

  if (sorted.length === 0) {
    return (
      <div
        className="iphone-panel rounded-[1.25rem] py-8 text-center text-sm"
        style={{ color: 'var(--text-muted)' }}
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

        const hasThird = isJummah && entry.iqama3

        return (
          <motion.div
            key={entry.masjid.id}
            variants={item}
            className={cn(
              'pressable flex min-h-[64px] items-center justify-between rounded-[1.2rem] px-4 py-3',
              entry.isPast ? 'opacity-50' : 'opacity-100'
            )}
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(231,226,216,0.90)',
              boxShadow: '0 1px 4px rgba(31,41,55,0.05)',
            }}
          >
            {/* Masjid name + city */}
            <div className="flex min-w-0 flex-col gap-0 pr-2">
              {(() => {
                const label = MASJID_LABELS[entry.masjid.name]
                return label ? (
                  <>
                    <span
                      className="text-[0.58rem] font-bold uppercase tracking-[0.14em]"
                      style={{ color: accentColor }}
                    >
                      {label.short}
                    </span>
                    <span
                      className="truncate text-[0.86rem] font-semibold leading-tight"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {label.full}
                    </span>
                    <span
                      className="text-[0.68rem] leading-tight"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {entry.masjid.city}
                    </span>
                  </>
                ) : (
                  <>
                    <span
                      className="truncate text-[0.92rem] font-semibold leading-tight"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {entry.masjid.name}
                    </span>
                    <span
                      className="text-[0.72rem] leading-tight"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {entry.masjid.city}
                    </span>
                  </>
                )
              })()}
              {entry.iqamaNote && (
                <span className="mt-1 max-w-[15rem] text-[0.65rem] leading-snug text-amber-800">{entry.iqamaNote}</span>
              )}
            </div>

            {/* Time(s) + directions */}
            <div className="ml-4 flex shrink-0 flex-col items-end gap-1.5">
              {entry.iqama ? (
                <TimePill time={entry.iqama} isPast={entry.isPast} accent={accentColor} />
              ) : (
                <a href={entry.sourceUrl ?? entry.masjid.website_url} target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: 'var(--text-muted)' }}>Check website</a>
              )}
              {entry.stale && <span className="text-[0.65rem] text-amber-800">Previous day: verify with masjid</span>}
              {hasBoth && entry.iqama2 && (
                <TimePill time={entry.iqama2} isPast={isTimePast(entry.iqama2)} accent={accentColor} />
              )}
              {hasThird && entry.iqama3 && (
                <TimePill time={entry.iqama3} isPast={isTimePast(entry.iqama3)} accent={accentColor} />
              )}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${entry.masjid.name}, ${entry.masjid.city}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex h-11 w-11 items-center justify-center"
                style={{ color: '#4F6F52' }}
                aria-label={`Get directions to ${entry.masjid.name}`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: '#EAF4EC' }}>
                  <Navigation className="h-3.5 w-3.5" />
                </span>
              </a>
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
