'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PrayerKey } from '@/types'
import { useDallasDate } from '@/hooks/useDallasDate'
import { usePrivateAuth } from '@/hooks/usePrivateAuth'
import { prayerKeysForSlot } from '@/lib/progress'
import {
  getPrivateSession,
  getPrivatePrayerCheckins,
  savePrivatePrayerCheckin,
  removePrivatePrayerSlot,
  isCurrentPrivateSession,
} from '@/lib/private-auth'
import PrivateAuthModal from '@/components/private-auth-modal'

interface Props {
  prayerKey: PrayerKey
  prayerLabel: string
  adhanTime: string | null
  adhanPast: boolean
}

export default function PrayerCardActions({
  prayerKey,
  prayerLabel,
  adhanTime,
  adhanPast,
}: Props) {
  const router = useRouter()
  const { session, loaded } = usePrivateAuth()
  const date = useDallasDate()
  const [storedCheckin, setCheckedIn] = useState(false)
  const [checkinOwner, setCheckinOwner] = useState('')
  const owner = `${session?.sessionToken}:${date}:${prayerKey}`
  const checkedIn = checkinOwner === owner && storedCheckin
  const [error, setError] = useState('')
  const busy = useRef(false)
  const loadSequence = useRef(0)
  const invalidateLoads = useCallback(() => { ++loadSequence.current }, [])
  const [authOpen, setAuthOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [undoVisible, setUndoVisible] = useState(false)
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadCheckin = useCallback(async () => {
    const request = ++loadSequence.current
    const activeSession = getPrivateSession()
    if (!activeSession) {
      setCheckedIn(false)
      setCheckinOwner('')
      return
    }
    try {
      const checkins = await getPrivatePrayerCheckins(date, date, activeSession)
      if (request !== loadSequence.current || !isCurrentPrivateSession(activeSession)) return
      setCheckedIn(checkins.some(c => c.date === date && prayerKeysForSlot(date, prayerKey).includes(c.prayer)))
      setCheckinOwner(`${activeSession.sessionToken}:${date}:${prayerKey}`)
      setError('')
    } catch {
      if (request === loadSequence.current && isCurrentPrivateSession(activeSession)) {
        setError('Could not check your saved progress. Try again when connected.')
      }
    }
  }, [date, prayerKey])

  useEffect(() => {
    if (!loaded) return
    const timer = window.setTimeout(() => {
      setUndoVisible(false)
      setError('')
      void loadCheckin()
    }, 0)
    return () => {
      window.clearTimeout(timer)
      invalidateLoads()
      if (undoTimer.current) clearTimeout(undoTimer.current)
    }
  }, [loadCheckin, loaded, session, invalidateLoads])

  const handleCheckin = async () => {
    if (checkedIn || busy.current) return
    const activeSession = getPrivateSession()
    if (!activeSession) {
      setAuthOpen(true)
      return
    }
    if (session?.sessionToken !== activeSession.sessionToken) return
    busy.current = true
    ++loadSequence.current
    setSaving(true)
    setError('')
    try {
      await savePrivatePrayerCheckin({ date, prayer: prayerKey, prayerLabel, adhanTime: adhanTime ?? '' }, activeSession)
      if (!isCurrentPrivateSession(activeSession)) return
      setCheckedIn(true)
      setCheckinOwner(`${activeSession.sessionToken}:${date}:${prayerKey}`)
      setUndoVisible(true)
      if (undoTimer.current) clearTimeout(undoTimer.current)
      undoTimer.current = setTimeout(() => setUndoVisible(false), 3000)
    } catch {
      if (isCurrentPrivateSession(activeSession)) {
        setError('Could not confirm your prayer was saved. Retry, or log in again from Settings.')
      }
    } finally {
      busy.current = false
      setSaving(false)
    }
  }

  const handleUndo = async () => {
    if (busy.current) return
    const activeSession = getPrivateSession()
    if (!activeSession) return
    if (session?.sessionToken !== activeSession.sessionToken) return
    busy.current = true
    ++loadSequence.current
    setSaving(true)
    setError('')
    if (undoTimer.current) clearTimeout(undoTimer.current)
    try {
      await removePrivatePrayerSlot(date, prayerKey, activeSession)
      if (!isCurrentPrivateSession(activeSession)) return
      setCheckedIn(false)
      setUndoVisible(false)
    } catch {
      if (isCurrentPrivateSession(activeSession)) {
        setError('Could not undo this check-in. Please retry.')
        setUndoVisible(true)
      }
    } finally {
      busy.current = false
      setSaving(false)
    }
  }

  const handleTasbih = () => {
    router.replace('/dhikr', { scroll: false })
  }

  if (!adhanTime || !adhanPast) {
    return (
      <p
        className="text-center text-[0.65rem] font-medium tracking-wide opacity-55"
        style={{ color: 'var(--text-muted)' }}
      >
        {!adhanTime ? 'Schedule unavailable' : prayerKey === 'jummah' ? 'Available after the listed khutbah start' : 'Available after Adhan'}
      </p>
    )
  }

  return (
    <div className="flex w-full flex-col items-center gap-2">
      {checkedIn ? (
        <div className="flex flex-col items-center gap-0.5 text-center">
          <p className="text-[0.7rem] font-semibold" style={{ color: '#4F6F52' }}>
            ✓ {prayerLabel} recorded
          </p>
          {undoVisible ? (
            <button
              type="button"
              onPointerDown={e => e.stopPropagation()}
              onClick={() => void handleUndo()}
              disabled={saving}
              className="text-[0.65rem] font-semibold underline underline-offset-2"
              style={{ color: 'var(--text-muted)' }}
            >
              Undo
            </button>
          ) : (
            <p className="text-[0.65rem]" style={{ color: 'var(--text-muted)' }}>
              May Allah accept it.
            </p>
          )}
        </div>
      ) : (
        <button
          type="button"
          onPointerDown={e => e.stopPropagation()}
          onClick={() => void handleCheckin()}
          disabled={saving}
          className="w-full rounded-full py-2 text-[0.65rem] font-semibold tracking-wide transition-all duration-150 active:scale-[0.96] active:shadow-none disabled:opacity-60"
          style={{
            background: 'linear-gradient(180deg, #5a7f5d 0%, #4F6F52 100%)',
            border: '1px solid #3d5640',
            borderBottomWidth: '2px',
            color: '#FFFFFF',
            boxShadow: '0 4px 12px rgba(79,111,82,0.45), 0 1px 3px rgba(79,111,82,0.3)',
          }}
        >
          {saving ? 'Saving...' : 'I prayed at the masjid'}
        </button>
      )}

      <button
        type="button"
        onPointerDown={e => e.stopPropagation()}
        onClick={handleTasbih}
        className="rounded-full px-5 py-2 text-[0.65rem] font-semibold tracking-wide transition-all duration-150 active:scale-[0.96] active:shadow-none"
        style={{
          background: 'linear-gradient(180deg, #d4b45a 0%, #C8A951 100%)',
          border: '1px solid #a88a3a',
          borderBottomWidth: '2px',
          color: '#FFFFFF',
          boxShadow: '0 4px 12px rgba(200,169,81,0.45), 0 1px 3px rgba(200,169,81,0.3)',
        }}
      >
        Tasbih
      </button>

      {error && <p role="alert" className="max-w-xs text-center text-xs text-red-700">{error}</p>}
      <PrivateAuthModal
        open={authOpen}
        reason="Create a private profile before saving prayer progress."
        onClose={() => setAuthOpen(false)}
      />
    </div>
  )
}
