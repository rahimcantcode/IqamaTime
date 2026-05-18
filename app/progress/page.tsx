'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  Flame,
  CheckCircle2,
  Circle,
  ChevronDown,
  CalendarDays,
  Sparkles,
} from 'lucide-react'
import BottomNav from '@/components/bottom-nav'
import {
  getLocalDate,
  getPrayerCheckins,
  savePrayerCheckin,
  removePrayerCheckin,
} from '@/lib/prayer-checkins'

const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

const MOCK_GRID: boolean[][] = [
  [true, true, true, true, true, false, true],
  [false, true, true, true, false, true, true],
  [true, true, false, true, true, true, true],
  [true, true, true, true, true, true, false],
  [true, false, true, false, true, true, true],
]

function getPrayerKey(prayer: string) {
  return prayer.toLowerCase()
}

function getPieBackground(count: number) {
  const active = 'rgba(79,111,82,0.82)'
  const soft = 'rgba(231,226,216,0.82)'
  const gap = 'rgba(250,250,247,1)'
  const slices: string[] = []

  for (let i = 0; i < 5; i++) {
    const start = i * 72
    const end = start + 69
    const color = i < count ? active : soft
    slices.push(`${color} ${start}deg ${end}deg`)
    slices.push(`${gap} ${end}deg ${start + 72}deg`)
  }

  return `conic-gradient(${slices.join(', ')})`
}

function weekDayCount(dayIndex: number) {
  return MOCK_GRID.reduce((total, row) => total + (row[dayIndex] ? 1 : 0), 0)
}

export default function ProgressPage() {
  const [todayLog, setTodayLog] = useState<Record<string, boolean>>({
    Fajr: false,
    Dhuhr: false,
    Asr: false,
    Maghrib: false,
    Isha: false,
  })
  const [editingToday, setEditingToday] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const date = getLocalDate()
      const checkins = getPrayerCheckins().filter(c => c.date === date)
      if (checkins.length === 0) return
      setTodayLog(prev => {
        const next = { ...prev }
        checkins.forEach(c => {
          const label = c.prayerLabel
          if (label in next) next[label] = true
        })
        return next
      })
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  const togglePrayer = (prayer: typeof PRAYERS[number]) => {
    const date = getLocalDate()
    const prayerKey = getPrayerKey(prayer)

    if (todayLog[prayer]) {
      removePrayerCheckin(date, prayerKey)
    } else {
      savePrayerCheckin({ date, prayer: prayerKey, prayerLabel: prayer, adhanTime: '' })
    }

    setTodayLog(prev => ({ ...prev, [prayer]: !prev[prayer] }))
  }

  const todayCount = Object.values(todayLog).filter(Boolean).length
  const streak = 12
  const weeklyTotal = MOCK_GRID.flat().filter(Boolean).length
  const weeklyMax = MOCK_GRID.flat().length
  const weekPercent = Math.round((weeklyTotal / weeklyMax) * 100)
  const completedPrayers = PRAYERS.filter(prayer => todayLog[prayer])
  const nextMissingPrayer = PRAYERS.find(prayer => !todayLog[prayer])

  return (
    <main
      className="min-h-screen overflow-x-clip bg-[#FAFAF7] scrollbar-none"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
    >
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_0%,rgba(143,174,147,0.14),transparent_28rem)]" />

      <div className="relative z-10 px-6 pb-2 pt-2">
        <div className="mb-1 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" style={{ color: '#4F6F52' }} />
          <h1 className="text-xl font-bold" style={{ color: '#202124' }}>
            Progress
          </h1>
        </div>
        <p className="text-xs" style={{ color: '#6B7280' }}>
          A calm view of your salah consistency
        </p>
      </div>

      <section className="relative z-10 px-6 pt-5">
        <div
          className="rounded-[1.8rem] border p-5"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(244,241,234,0.72))',
            borderColor: '#E7E2D8',
            boxShadow: '0 10px 32px rgba(31,41,55,0.06)',
          }}
        >
          <div className="flex items-center gap-5">
            <div className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full">
              <div
                className="absolute inset-0 rounded-full"
                style={{ background: getPieBackground(todayCount) }}
              />
              <div
                className="relative flex h-[5.9rem] w-[5.9rem] flex-col items-center justify-center rounded-full border"
                style={{ background: '#FFFFFF', borderColor: '#E7E2D8' }}
              >
                <p className="text-3xl font-bold tabular-nums" style={{ color: '#202124' }}>
                  {todayCount}/5
                </p>
                <p className="text-[0.58rem] font-semibold uppercase tracking-[0.16em]" style={{ color: '#9CA3AF' }}>
                  Today
                </p>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.62rem] font-semibold" style={{ background: 'rgba(79,111,82,0.09)', color: '#4F6F52' }}>
                <Sparkles className="h-3 w-3" />
                Daily masjid log
              </div>
              <h2 className="text-lg font-bold leading-tight" style={{ color: '#202124' }}>
                {todayCount === 5 ? 'Complete day, mashaAllah' : `${5 - todayCount} prayers left today`}
              </h2>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: '#6B7280' }}>
                {completedPrayers.length
                  ? `Logged: ${completedPrayers.join(', ')}`
                  : 'Nothing logged yet. Add prayers as you complete them.'}
              </p>
              {nextMissingPrayer && (
                <p className="mt-2 text-[0.68rem] font-medium" style={{ color: '#9CA3AF' }}>
                  Next to log: {nextMissingPrayer}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 grid grid-cols-3 gap-3 px-6 pt-4">
        {[
          { label: 'Streak', value: streak, unit: 'days', icon: Flame, accent: '#C8A951' },
          { label: 'Today', value: `${todayCount}/5`, unit: 'logged', icon: CheckCircle2, accent: '#4F6F52' },
          { label: 'Week', value: `${weekPercent}%`, unit: 'score', icon: CalendarDays, accent: '#4F6F52' },
        ].map(({ label, value, unit, icon: Icon, accent }) => (
          <div
            key={label}
            className="flex min-h-[102px] flex-col items-center justify-center rounded-[1.2rem] px-2 py-4 text-center"
            style={{ background: '#FFFFFF', border: '1px solid #E7E2D8', boxShadow: '0 1px 4px rgba(31,41,55,0.05)' }}
          >
            <Icon className="mb-1 h-4 w-4" style={{ color: accent }} />
            <p className="text-2xl font-bold tabular-nums" style={{ color: '#202124' }}>
              {value}
            </p>
            <p className="mt-0.5 text-[0.6rem] font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>
              {unit}
            </p>
            <p className="mt-0.5 text-[0.6rem]" style={{ color: '#9CA3AF' }}>
              {label}
            </p>
          </div>
        ))}
      </section>

      <section className="relative z-10 px-6 pt-6">
        <button
          type="button"
          onClick={() => setEditingToday(open => !open)}
          className="pressable flex w-full items-center justify-between rounded-[1.35rem] px-4 py-4 text-left"
          style={{ background: '#FFFFFF', border: '1px solid #E7E2D8', boxShadow: '0 1px 4px rgba(31,41,55,0.05)' }}
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: '#202124' }}>
              Edit today’s masjid prayers
            </p>
            <p className="mt-0.5 text-xs" style={{ color: '#9CA3AF' }}>
              Select the prayers you completed at the masjid today
            </p>
          </div>
          <ChevronDown
            className={`h-5 w-5 transition-transform ${editingToday ? 'rotate-180' : ''}`}
            style={{ color: '#9CA3AF' }}
          />
        </button>

        {editingToday && (
          <div
            className="mt-3 overflow-hidden rounded-[1.35rem] border"
            style={{ background: '#FFFFFF', borderColor: '#E7E2D8', boxShadow: '0 1px 4px rgba(31,41,55,0.05)' }}
          >
            {PRAYERS.map((prayer, index) => {
              const active = todayLog[prayer]
              return (
                <button
                  key={prayer}
                  type="button"
                  onClick={() => togglePrayer(prayer)}
                  className={`pressable flex w-full items-center justify-between px-4 py-3.5 ${index < PRAYERS.length - 1 ? 'border-b border-[#E7E2D8]' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full"
                      style={{
                        background: active ? 'rgba(79,111,82,0.12)' : 'rgba(31,41,55,0.04)',
                        color: active ? '#4F6F52' : '#9CA3AF',
                      }}
                    >
                      {active ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                    </div>
                    <span className="text-sm font-medium" style={{ color: '#202124' }}>
                      {prayer}
                    </span>
                  </div>
                  <span className="text-[0.62rem] font-semibold" style={{ color: active ? '#4F6F52' : '#9CA3AF' }}>
                    {active ? 'Logged' : 'Tap to log'}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </section>

      <section className="relative z-10 px-6 pb-32 pt-7">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em]" style={{ color: '#9CA3AF' }}>
              This Week
            </p>
            <p className="mt-1 text-xs" style={{ color: '#6B7280' }}>
              Daily completion by prayer
            </p>
          </div>
          <p className="text-xs font-semibold tabular-nums" style={{ color: '#4F6F52' }}>
            {weeklyTotal}/{weeklyMax}
          </p>
        </div>

        <div
          className="rounded-[1.5rem] border p-4"
          style={{ background: '#FFFFFF', borderColor: '#E7E2D8', boxShadow: '0 1px 4px rgba(31,41,55,0.05)' }}
        >
          <div className="grid grid-cols-7 gap-2">
            {DAYS.map((day, dayIndex) => {
              const count = weekDayCount(dayIndex)
              return (
                <div key={day} className="flex flex-col items-center gap-2">
                  <p className="text-[0.62rem] font-semibold" style={{ color: '#9CA3AF' }}>
                    {day}
                  </p>
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold tabular-nums"
                    style={{
                      background: count === 5 ? 'rgba(79,111,82,0.16)' : 'rgba(244,241,234,0.86)',
                      color: count === 5 ? '#4F6F52' : '#6B7280',
                      border: count === 5 ? '1px solid rgba(79,111,82,0.24)' : '1px solid rgba(231,226,216,0.92)',
                    }}
                  >
                    {count}/5
                  </div>
                  <div className="flex flex-col gap-1">
                    {PRAYERS.map((_, prayerIndex) => (
                      <span
                        key={prayerIndex}
                        className="h-1.5 w-7 rounded-full"
                        style={{
                          background: MOCK_GRID[prayerIndex][dayIndex]
                            ? 'rgba(79,111,82,0.72)'
                            : 'rgba(231,226,216,0.95)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-5 grid grid-cols-5 gap-1.5">
            {PRAYERS.map((prayer, prayerIndex) => {
              const total = MOCK_GRID[prayerIndex].filter(Boolean).length
              return (
                <div key={prayer} className="rounded-2xl px-2 py-2 text-center" style={{ background: 'rgba(244,241,234,0.62)' }}>
                  <p className="truncate text-[0.58rem] font-semibold" style={{ color: '#6B7280' }}>
                    {prayer}
                  </p>
                  <p className="mt-0.5 text-xs font-bold tabular-nums" style={{ color: '#4F6F52' }}>
                    {total}/7
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        <p className="mt-5 text-center text-xs" style={{ color: '#9CA3AF' }}>
          Local progress for now · Full sync coming soon
        </p>
      </section>

      <BottomNav />
    </main>
  )
}
