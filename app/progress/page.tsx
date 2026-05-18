'use client'

import { useState } from 'react'
import { TrendingUp, Flame, CheckCircle2, Circle } from 'lucide-react'

const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const
const DAYS    = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

const MOCK_GRID: boolean[][] = [
  [true,  true,  true,  true,  true,  false, true ],
  [false, true,  true,  true,  false, true,  true ],
  [true,  true,  false, true,  true,  true,  true ],
  [true,  true,  true,  true,  true,  true,  false],
  [true,  false, true,  false, true,  true,  true ],
]

export default function ProgressPage() {
  const [todayLog, setTodayLog] = useState<Record<string, boolean>>({
    Fajr: true, Dhuhr: true, Asr: false, Maghrib: false, Isha: false,
  })

  const todayCount  = Object.values(todayLog).filter(Boolean).length
  const streak      = 12
  const weeklyTotal = MOCK_GRID.flat().filter(Boolean).length
  const weeklyMax   = MOCK_GRID.flat().length

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-y-auto bg-[#FAFAF7] scrollbar-none scroll-momentum"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
    >
      {/* Header */}
      <div className="px-6 pb-2 pt-2">
        <div className="mb-1 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" style={{ color: '#4F6F52' }} />
          <h1 className="text-xl font-bold" style={{ color: '#202124' }}>Progress</h1>
        </div>
        <p className="text-xs" style={{ color: '#6B7280' }}>Track your prayer consistency</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 px-6 pb-2 pt-4">
        {[
          { label: 'Streak',    value: streak,                        unit: 'days',    accent: '#C8A951' },
          { label: 'Today',     value: `${todayCount}/5`,             unit: 'prayers', accent: '#4F6F52' },
          { label: 'This Week', value: `${weeklyTotal}/${weeklyMax}`, unit: 'prayed',  accent: '#4F6F52' },
        ].map(({ label, value, unit, accent }) => (
          <div
            key={label}
            className="flex min-h-[104px] flex-col items-center justify-center rounded-[1.2rem] px-2 py-4"
            style={{ background: '#FFFFFF', border: '1px solid #E7E2D8', boxShadow: '0 1px 4px rgba(31,41,55,0.05)' }}
          >
            {label === 'Streak' && (
              <Flame className="mb-1 w-4 h-4" style={{ color: accent }} />
            )}
            <p className="text-2xl font-bold tabular-nums" style={{ color: '#202124' }}>{value}</p>
            <p className="mt-0.5 text-[0.6rem] font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{unit}</p>
            <p className="mt-0.5 text-[0.6rem]" style={{ color: '#9CA3AF' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Today's prayers */}
      <section className="px-6 pb-2 pt-6">
        <p className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.18em]" style={{ color: '#9CA3AF' }}>
          Today
        </p>
        <div className="flex flex-col gap-2">
          {PRAYERS.map(prayer => (
            <button
              key={prayer}
              onClick={() => setTodayLog(p => ({ ...p, [prayer]: !p[prayer] }))}
              className="pressable flex min-h-[62px] items-center justify-between rounded-[1.2rem] px-4 py-3.5 transition-colors"
              style={{ background: '#FFFFFF', border: '1px solid #E7E2D8', boxShadow: '0 1px 4px rgba(31,41,55,0.05)' }}
            >
              <span className="text-sm font-medium" style={{ color: '#202124' }}>{prayer}</span>
              {todayLog[prayer]
                ? <CheckCircle2 className="w-5 h-5" style={{ color: '#4F6F52' }} />
                : <Circle className="w-5 h-5" style={{ color: '#9CA3AF' }} />
              }
            </button>
          ))}
        </div>
      </section>

      {/* Weekly grid */}
      <section className="px-6 pb-32 pt-6">
        <p className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.18em]" style={{ color: '#9CA3AF' }}>
          This Week
        </p>
        <div
          className="overflow-hidden rounded-[1.2rem] p-4"
          style={{ background: '#FFFFFF', border: '1px solid #E7E2D8', boxShadow: '0 1px 4px rgba(31,41,55,0.05)' }}
        >
          {/* Day headers */}
          <div className="mb-3 grid grid-cols-8">
            <div />
            {DAYS.map(d => (
              <p key={d} className="text-center text-[0.6rem] font-semibold" style={{ color: '#9CA3AF' }}>{d}</p>
            ))}
          </div>
          {/* Grid rows */}
          {PRAYERS.map((prayer, pi) => (
            <div key={prayer} className="mb-2 grid grid-cols-8 items-center">
              <p className="truncate pr-1 text-[0.6rem] font-medium" style={{ color: '#9CA3AF' }}>{prayer}</p>
              {DAYS.map((_, di) => (
                <div key={di} className="flex justify-center">
                  <div
                    className="h-4 w-4 rounded-md"
                    style={{
                      background: MOCK_GRID[pi][di]
                        ? 'rgba(79,111,82,0.65)'
                        : 'rgba(231,226,216,0.80)',
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: '#9CA3AF' }}>
          Tap a prayer above to log it · Full sync coming soon
        </p>
      </section>
    </div>
  )
}
