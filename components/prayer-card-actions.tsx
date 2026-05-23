'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PrayerKey } from '@/types'
import { getLocalDate } from '@/lib/prayer-checkins'
import {
  getPrivateSession,
  getPrivatePrayerCheckins,
  savePrivatePrayerCheckin,
  removePrivatePrayerCheckin,
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
  const [checkedIn, setCheckedIn] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [undoVisible, setUndoVisible] = useState(false)
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadCheckin = async () => {
    const session = getPrivateSession()
    if (!session) {
      setCheckedIn(false)
      return
    }

    try {
      const date = getLocalDate()
      const checkins = await getPrivatePrayerCheckins(date, date, session)
      setCheckedIn(checkins.some(c => c.date === date && c.prayer === prayerKey))
    } catch {
      setCheckedIn(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(loadCheckin, 0)
    return () => window.clearTimeout(timer)
  }, [prayerKey])

  const handleCheckin = async () => {
    if (checkedIn || saving) return

    const session = getPrivateSession()
    if (!session) {
      setAuthOpen(true)
      return
    }

    setSaving(true)
    try {
      await savePrivatePrayerCheckin({
        date: getLocalDate(),
        prayer: prayerKey,
        prayerLabel,
        adhanTime: adhanTime ?? '',
      }, session)
      setCheckedIn(true)
      setUndoVisible(true)
      if (undoTimer.current) clearTimeout(undoTimer.current)
      undoTimer.current = setTimeout(() => setUndoVisible(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleUndo = async () => {
    if (undoTimer.current) clearTimeout(undoTimer.current)
    setUndoVisible(false)
    const session = getPrivateSession()
    if (!session) return
    try {
      await removePrivatePrayerCheckin(getLocalDate(), prayerKey, session)
      setCheckedIn(false)
    } catch {
      // checkin stays if removal fails
    }
  }

  const handleTasbih = () => {
    router.replace('/dhikr', { scroll: false })
  }

  if (!adhanPast) {
    return (
      <p
        className="text-center text-[0.65rem] font-medium tracking-wide opacity-55"
        style={{ color: 'var(--text-muted)' }}
      >
        Available after Adhan
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
              onClick={handleUndo}
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
          onClick={handleCheckin}
          disabled={saving}
          className="w-full rounded-full py-1.5 text-[0.62rem] font-semibold tracking-wide transition-all active:scale-95 disabled:opacity-60"
          style={{
            background: 'rgba(79,111,82,0.13)',
            border: '1px solid rgba(79,111,82,0.28)',
            color: '#4F6F52',
          }}
        >
          {saving ? 'Saving...' : 'I prayed at the masjid'}
        </button>
      )}

      <button
        type="button"
        onPointerDown={e => e.stopPropagation()}
        onClick={handleTasbih}
        className="rounded-full px-5 py-1.5 text-[0.62rem] font-semibold tracking-wide transition-all active:scale-95"
        style={{
          background: 'transparent',
          border: '1px solid rgba(200,169,81,0.45)',
          color: '#C8A951',
        }}
      >
        Tasbih
      </button>

      <PrivateAuthModal
        open={authOpen}
        reason="Create a private profile before saving prayer progress."
        onClose={() => setAuthOpen(false)}
        onSuccess={() => loadCheckin()}
      />
    </div>
  )
}
