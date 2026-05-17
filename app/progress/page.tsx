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
      className="fixed inset-0 flex flex-col bg-[#131925] overflow-y-auto scrollbar-none"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
    >
      {/* Header */}
      <div className="px-6 pb-2 pt-2">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-5 h-5" style={{ color: '#1ca094' }} />
          <h1 className="text-xl font-bold text-white">Progress</h1>
        </div>
        <p className="text-xs text-white/30">Track your prayer consistency</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 px-6 pt-4 pb-2">
        {[
          { label: 'Streak',       value: streak,                    unit: 'days', accent: '#d4af37' },
          { label: "Today",        value: `${todayCount}/5`,         unit: 'prayers', accent: '#1ca094' },
          { label: 'This Week',    value: `${weeklyTotal}/${weeklyMax}`, unit: 'prayed', accent: '#1ca094' },
        ].map(({ label, value, unit, accent }) => (
          <div
            key={label}
            className="flex flex-col items-center justify-center py-4 px-2 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {label === 'Streak' && (
              <Flame className="w-4 h-4 mb-1" style={{ color: accent }} />
            )}
            <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
            <p className="text-[0.6rem] font-semibold tracking-wide text-white/30 uppercase mt-0.5">{unit}</p>
            <p className="text-[0.6rem] text-white/20 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Today's prayers */}
      <section className="px-6 pt-6 pb-2">
        <p className="text-[0.65rem] font-semibold tracking-[0.18em] uppercase text-white/30 mb-3">
          Today
        </p>
        <div className="flex flex-col gap-2">
          {PRAYERS.map(prayer => (
            <button
              key={prayer}
              onClick={() => setTodayLog(p => ({ ...p, [prayer]: !p[prayer] }))}
              className="flex items-center justify-between px-4 py-3.5 rounded-2xl transition-colors active:scale-[0.98]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className="text-sm font-medium text-white">{prayer}</span>
              {todayLog[prayer]
                ? <CheckCircle2 className="w-5 h-5" style={{ color: '#1ca094' }} />
                : <Circle className="w-5 h-5 text-white/20" />
              }
            </button>
          ))}
        </div>
      </section>

      {/* Weekly grid */}
      <section className="px-6 pt-6 pb-32">
        <p className="text-[0.65rem] font-semibold tracking-[0.18em] uppercase text-white/30 mb-3">
          This Week
        </p>
        <div
          className="rounded-2xl overflow-hidden p-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Day headers */}
          <div className="grid grid-cols-8 mb-3">
            <div /> {/* prayer label column */}
            {DAYS.map(d => (
              <p key={d} className="text-[0.6rem] text-white/30 font-semibold text-center">{d}</p>
            ))}
          </div>
          {/* Grid rows */}
          {PRAYERS.map((prayer, pi) => (
            <div key={prayer} className="grid grid-cols-8 mb-2 items-center">
              <p className="text-[0.6rem] text-white/30 font-medium pr-1 truncate">{prayer}</p>
              {DAYS.map((_, di) => (
                <div key={di} className="flex justify-center">
                  <div
                    className="w-4 h-4 rounded-md"
                    style={{
                      background: MOCK_GRID[pi][di]
                        ? 'rgba(28,160,148,0.7)'
                        : 'rgba(255,255,255,0.06)',
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-white/15 mt-6">
          Tap a prayer above to log it · Full sync coming soon
        </p>
      </section>
    </div>
  )
}
