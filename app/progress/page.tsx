'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  TrendingUp,
  CheckCircle2,
  Circle,
  ChevronDown,
  CalendarDays,
  Sparkles,
  PencilLine,
  Lock,
} from 'lucide-react'
import BottomNav from '@/components/bottom-nav'
import PrivateAuthModal from '@/components/private-auth-modal'
import { usePrivateAuth } from '@/hooks/usePrivateAuth'
import { useDallasDate } from '@/hooks/useDallasDate'
import { PROGRESS_PRAYERS as PRAYERS, type ProgressPrayer as PrayerName, type WeekLog, emptyDayLog, getProgressWeek, buildWeekLog } from '@/lib/progress'
import {
  getPrivatePrayerCheckins,
  savePrivatePrayerCheckin,
  removePrivatePrayerSlot,
  isCurrentPrivateSession,
  getPrivateSession,
} from '@/lib/private-auth'

const PRAYER_INITIALS = ['F', 'D', 'A', 'M', 'I'] as const

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

function getDayMood(count: number) {
  if (count === 5) return 'Complete'
  if (count >= 4) return 'Strong'
  if (count >= 3) return 'Steady'
  if (count >= 1) return 'Started'
  return 'Open'
}

export default function ProgressPage() {
  const { session, isLoggedIn, loaded } = usePrivateAuth()
  const [authOpen, setAuthOpen] = useState(false)

  const todayKey = useDallasDate()
  const weekDates = useMemo(() => getProgressWeek(todayKey), [todayKey])
  const [storedWeekLog, setWeekLog] = useState<WeekLog>(() => buildWeekLog(weekDates))
  const [progressOwner, setProgressOwner] = useState('')
  const [editingToday, setEditingToday] = useState(false)
  const [editingWeek, setEditingWeek] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(false)
  const [progressError, setProgressError] = useState('')
  const [pending, setPending] = useState<Set<string>>(new Set())
  const pendingRef = useRef(new Set<string>())
  const loadSequence = useRef(0)
  const invalidateLoads = useCallback(() => { ++loadSequence.current }, [])
  const progressReady = !!session && progressOwner === `${session.sessionToken}:${todayKey}`
  const weekLog = progressReady ? storedWeekLog : buildWeekLog(weekDates)
  const pendingKey = (date: string, prayer: string) => `${session?.sessionToken}:${date}:${prayer}`

  const loadWeek = useCallback(async () => {
    const request = ++loadSequence.current
    const activeSession = getPrivateSession()
    if (!activeSession) {
      setProgressOwner('')
      setLoadingProgress(false)
      return
    }
    setLoadingProgress(true)
    setProgressError('')
    try {
      const checkins = await getPrivatePrayerCheckins(weekDates[0].dateKey, weekDates[6].dateKey, activeSession)
      if (request !== loadSequence.current || !isCurrentPrivateSession(activeSession)) return
      setWeekLog(buildWeekLog(weekDates, checkins))
      setProgressOwner(`${activeSession.sessionToken}:${todayKey}`)
    } catch {
      if (request === loadSequence.current && isCurrentPrivateSession(activeSession)) {
        setProgressError('Your progress could not be loaded. Retry, or log in again from Settings.')
      }
    } finally {
      if (request === loadSequence.current) setLoadingProgress(false)
    }
  }, [weekDates, todayKey])

  useEffect(() => {
    if (!loaded) return
    const timer = window.setTimeout(() => {
      if (!session) {
        setAuthOpen(true)
        setProgressOwner('')
        setProgressError('')
        setLoadingProgress(false)
      } else {
        void loadWeek()
      }
    }, 0)
    return () => {
      window.clearTimeout(timer)
      invalidateLoads()
    }
  }, [loaded, session, loadWeek, invalidateLoads])

  const togglePrayerForDate = async (dateKey: string, prayer: PrayerName) => {
    const activeSession = getPrivateSession()
    if (!activeSession) {
      setAuthOpen(true)
      return
    }
    const key = `${activeSession.sessionToken}:${dateKey}:${prayer}`
    const active = weekLog[dateKey]?.[prayer] ?? false
    if (session?.sessionToken !== activeSession.sessionToken || !progressReady || loadingProgress || (dateKey > todayKey && !active) || pendingRef.current.has(key)) return
    // A ref closes the double-click window before React renders disabled controls.
    pendingRef.current.add(key)
    setPending(new Set(pendingRef.current))
    setProgressError('')
    setWeekLog(prev => ({ ...prev, [dateKey]: { ...(prev[dateKey] ?? emptyDayLog()), [prayer]: !active } }))
    try {
      if (active) {
        await removePrivatePrayerSlot(dateKey, prayer.toLowerCase(), activeSession)
      } else {
        await savePrivatePrayerCheckin({ date: dateKey, prayer: prayer.toLowerCase(), prayerLabel: prayer, adhanTime: '' }, activeSession)
      }
    } catch {
      if (isCurrentPrivateSession(activeSession)) {
        setWeekLog(prev => ({ ...prev, [dateKey]: { ...(prev[dateKey] ?? emptyDayLog()), [prayer]: active } }))
        setProgressError('That change could not be confirmed. Reload to verify, or log in again from Settings if your session expired.')
      }
    } finally {
      pendingRef.current.delete(key)
      setPending(new Set(pendingRef.current))
    }
  }

  const todayLog = weekLog[todayKey] ?? emptyDayLog()
  const todayCount = Object.values(todayLog).filter(Boolean).length
  const completedDays = weekDates.filter(({ dateKey }) => Object.values(weekLog[dateKey] ?? emptyDayLog()).every(Boolean)).length
  const weeklyTotal = weekDates.reduce((total, { dateKey }) => {
    return total + Object.values(weekLog[dateKey] ?? emptyDayLog()).filter(Boolean).length
  }, 0)
  const weeklyMax = weekDates.length * PRAYERS.length
  const weekPercent = Math.round((weeklyTotal / weeklyMax) * 100)
  const completedPrayers = PRAYERS.filter(prayer => todayLog[prayer])
  const nextMissingPrayer = PRAYERS.find(prayer => !todayLog[prayer])

  return (
    <main
      className="min-h-screen overflow-x-clip bg-[--background] scrollbar-none"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
    >
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_0%,rgba(143,174,147,0.14),transparent_28rem)]" />

      <div className="relative z-10 px-6 pb-2 pt-2">
        <div className="mb-1 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" style={{ color: '#4F6F52' }} />
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Progress
          </h1>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          A calm view of your salah consistency
        </p>
      </div>

      {!isLoggedIn && loaded ? (
        <section className="relative z-10 px-6 pt-8">
          <div
            className="rounded-[1.8rem] border px-5 py-8 text-center"
            style={{ background: '#FFFFFF', borderColor: 'var(--border)', boxShadow: '0 10px 32px rgba(31,41,55,0.06)' }}
          >
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: 'rgba(79,111,82,0.11)', color: '#4F6F52' }}
            >
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Private progress dashboard
            </h2>
            <p className="mx-auto mt-2 max-w-[260px] text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Create a private username and PIN to save your salah progress and keep it separate from everyone else.
            </p>
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="pressable mt-5 rounded-full px-6 py-3 text-sm font-semibold"
              style={{ background: '#4F6F52', color: '#FFFFFF' }}
            >
              Log in or create profile
            </button>
          </div>
        </section>
      ) : !progressReady ? (
        <section className="relative z-10 px-6 pt-8" aria-live="polite">
          <p>{progressError || 'Loading your private progress...'}</p>
          {progressError && <button type="button" className="mt-3 rounded-full border px-4 py-2" disabled={loadingProgress} onClick={() => void loadWeek()}>Retry</button>}
        </section>
      ) : (
        <>
          {progressError && <p role="alert" className="relative z-10 mx-6 mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-800">{progressError} <button type="button" disabled={loadingProgress || pending.size > 0} onClick={() => void loadWeek()} className="underline">Reload progress</button></p>}
          <section className="relative z-10 px-6 pt-5">
            <div
              className="rounded-[1.8rem] border p-5"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(244,241,234,0.72))',
                borderColor: 'var(--border)',
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
                    style={{ background: '#FFFFFF', borderColor: 'var(--border)' }}
                  >
                    <p className="text-3xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                      {todayCount}/5
                    </p>
                    <p className="text-[0.58rem] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>
                      Today
                    </p>
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.62rem] font-semibold" style={{ background: 'rgba(79,111,82,0.09)', color: '#4F6F52' }}>
                    <Sparkles className="h-3 w-3" />
                    @{session?.username ?? 'profile'}
                  </div>
                  <h2 className="text-lg font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                    {todayCount === 5 ? 'Complete day, mashaAllah' : `${5 - todayCount} prayers left today`}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {loadingProgress
                      ? 'Loading your private progress...'
                      : completedPrayers.length
                        ? `Logged: ${completedPrayers.join(', ')}`
                        : 'Nothing logged yet. Add prayers as you complete them.'}
                  </p>
                  {nextMissingPrayer && !loadingProgress && (
                    <p className="mt-2 text-[0.68rem] font-medium" style={{ color: 'var(--text-muted)' }}>
                      Next to log: {nextMissingPrayer}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="relative z-10 grid grid-cols-3 gap-3 px-6 pt-4">
            {[
              { label: 'Complete', value: completedDays, unit: 'days this week', icon: CheckCircle2, accent: '#C8A951' },
              { label: 'Today', value: `${todayCount}/5`, unit: 'logged', icon: CheckCircle2, accent: '#4F6F52' },
              { label: 'Week', value: `${weekPercent}%`, unit: 'score', icon: CalendarDays, accent: '#4F6F52' },
            ].map(({ label, value, unit, icon: Icon, accent }) => (
              <div
                key={label}
                className="flex min-h-[102px] flex-col items-center justify-center rounded-[1.2rem] px-2 py-4 text-center"
                style={{ background: '#FFFFFF', border: '1px solid #E7E2D8', boxShadow: '0 1px 4px rgba(31,41,55,0.05)' }}
              >
                <Icon className="mb-1 h-4 w-4" style={{ color: accent }} />
                <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {value}
                </p>
                <p className="mt-0.5 text-[0.6rem] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  {unit}
                </p>
                <p className="mt-0.5 text-[0.6rem]" style={{ color: 'var(--text-muted)' }}>
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
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Edit today’s masjid prayers
                </p>
                <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  Select the prayers you completed at the masjid today
                </p>
              </div>
              <ChevronDown
                className={`h-5 w-5 transition-transform ${editingToday ? 'rotate-180' : ''}`}
                style={{ color: 'var(--text-muted)' }}
              />
            </button>

            {editingToday && (
              <div
                className="mt-3 overflow-hidden rounded-[1.35rem] border"
                style={{ background: '#FFFFFF', borderColor: 'var(--border)', boxShadow: '0 1px 4px rgba(31,41,55,0.05)' }}
              >
                {PRAYERS.map((prayer, index) => {
                  const active = todayLog[prayer]
                  return (
                    <button
                      key={prayer}
                      type="button"
                      onClick={() => void togglePrayerForDate(todayKey, prayer)}
                      disabled={loadingProgress || pending.has(pendingKey(todayKey, prayer))}
                      aria-pressed={active}
                      className={`pressable flex w-full items-center justify-between px-4 py-3.5 ${index < PRAYERS.length - 1 ? 'border-b border-[#E7E2D8]' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full"
                          style={{
                            background: active ? 'rgba(79,111,82,0.12)' : 'rgba(31,41,55,0.04)',
                            color: active ? '#4F6F52' : 'var(--text-muted)',
                          }}
                        >
                          {active ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                        </div>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {prayer}
                        </span>
                      </div>
                      <span className="text-[0.62rem] font-semibold" style={{ color: active ? '#4F6F52' : 'var(--text-muted)' }}>
                        {pending.has(pendingKey(todayKey, prayer)) ? 'Saving...' : active ? 'Logged' : 'Tap to log'}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          <section className="relative z-10 px-6 pb-32 pt-7">
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                  Weekly Rhythm
                </p>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Edit today and earlier days this week
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingWeek(open => !open)}
                className="pressable inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{ background: editingWeek ? 'rgba(79,111,82,0.14)' : 'rgba(79,111,82,0.08)', color: '#4F6F52' }}
              >
                <PencilLine className="h-3.5 w-3.5" />
                {editingWeek ? 'Done' : 'Edit week'}
              </button>
            </div>

            <div
              className="overflow-hidden rounded-[1.6rem] border"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(244,241,234,0.58))',
                borderColor: 'var(--border)',
                boxShadow: '0 8px 28px rgba(31,41,55,0.06)',
              }}
            >
              <div className="px-4 pb-3 pt-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Week completion
                  </p>
                  <p className="text-xs font-bold tabular-nums" style={{ color: '#4F6F52' }}>
                    {weeklyTotal}/{weeklyMax} · {weekPercent}%
                  </p>
                </div>
                <div className="h-2 overflow-hidden rounded-full" style={{ background: 'rgba(231,226,216,0.85)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${weekPercent}%`, background: 'linear-gradient(90deg, rgba(79,111,82,0.78), rgba(143,174,147,0.88))' }}
                  />
                </div>
              </div>

              <div className="border-t border-[#E7E2D8]/80">
                {weekDates.map(({ day, dateKey, shortDate }, dayIndex) => {
                  const dayLog = weekLog[dateKey] ?? emptyDayLog()
                  const count = Object.values(dayLog).filter(Boolean).length
                  const mood = getDayMood(count)
                  const isToday = dateKey === todayKey

                  return (
                    <div
                      key={dateKey}
                      className={`px-4 py-3 ${dayIndex < weekDates.length - 1 ? 'border-b border-[#E7E2D8]/70' : ''}`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-2xl text-xs font-bold"
                            style={{
                              background: count === 5 ? 'rgba(79,111,82,0.14)' : 'rgba(244,241,234,0.90)',
                              color: count === 5 ? '#4F6F52' : 'var(--text-secondary)',
                            }}
                          >
                            {day}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {count}/5 prayers
                              </p>
                              {isToday && (
                                <span className="rounded-full px-2 py-0.5 text-[0.55rem] font-semibold" style={{ background: 'rgba(200,169,81,0.14)', color: '#C8A951' }}>
                                  Today
                                </span>
                              )}
                            </div>
                            <p className="text-[0.62rem]" style={{ color: 'var(--text-muted)' }}>
                              {mood} · {shortDate}
                            </p>
                          </div>
                        </div>

                        {count === 5 && (
                          <span className="rounded-full px-2.5 py-1 text-[0.58rem] font-semibold" style={{ background: 'rgba(79,111,82,0.10)', color: '#4F6F52' }}>
                            Complete
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-5 gap-2">
                        {PRAYERS.map((prayer, prayerIndex) => {
                          const prayed = dayLog[prayer]
                          const content = (
                            <>
                              <div
                                className="flex h-6 w-6 items-center justify-center rounded-full text-[0.6rem] font-bold"
                                style={{
                                  background: prayed ? 'rgba(79,111,82,0.76)' : 'rgba(255,255,255,0.76)',
                                  color: prayed ? '#FFFFFF' : 'var(--text-muted)',
                                }}
                              >
                                {prayed ? '✓' : PRAYER_INITIALS[prayerIndex]}
                              </div>
                              <p className="text-[0.52rem] font-semibold" style={{ color: prayed ? '#4F6F52' : 'var(--text-muted)' }}>
                                {PRAYER_INITIALS[prayerIndex]}
                              </p>
                            </>
                          )

                          const sharedStyle = {
                            background: prayed ? 'rgba(79,111,82,0.10)' : 'rgba(231,226,216,0.42)',
                            border: editingWeek
                              ? prayed ? '1px solid rgba(79,111,82,0.32)' : '1px solid rgba(200,169,81,0.32)'
                              : prayed ? '1px solid rgba(79,111,82,0.16)' : '1px solid rgba(231,226,216,0.76)',
                          }

                          return editingWeek ? (
                            <button
                              key={`${dateKey}-${prayer}`}
                              type="button"
                              onClick={() => void togglePrayerForDate(dateKey, prayer)}
                              disabled={loadingProgress || (dateKey > todayKey && !prayed) || pending.has(pendingKey(dateKey, prayer))}
                              aria-label={`${prayer}, ${day} ${shortDate}${dateKey > todayKey ? ', future date' : ''}`}
                              aria-pressed={prayed}
                              className="pressable flex flex-col items-center gap-1 rounded-2xl px-1.5 py-2"
                              style={sharedStyle}
                            >
                              {content}
                            </button>
                          ) : (
                            <div
                              key={`${dateKey}-${prayer}`}
                              className="flex flex-col items-center gap-1 rounded-2xl px-1.5 py-2"
                              style={sharedStyle}
                            >
                              {content}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-center gap-4 px-4 py-3 text-[0.58rem] font-medium" style={{ color: 'var(--text-muted)' }}>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'rgba(79,111,82,0.76)' }} />
                  Logged
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'rgba(231,226,216,0.95)' }} />
                  Open
                </span>
              </div>
            </div>

            <p className="mt-5 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              {pending.size ? 'Saving to your profile...' : progressError ? 'A change could not be confirmed. See the message above.' : 'Saved privately to your profile'}
            </p>
          </section>
        </>
      )}

      <PrivateAuthModal
        open={authOpen}
        reason="Create a private profile before viewing or editing your progress."
        onClose={() => setAuthOpen(false)}
      />

      <BottomNav />
    </main>
  )
}
