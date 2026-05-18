'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PrayerKey } from '@/types'
import {
  getLocalDate,
  getPrayerCheckinForDateAndPrayer,
  savePrayerCheckin,
} from '@/lib/prayer-checkins'

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

  // Read from localStorage after mount (SSR-safe)
  useEffect(() => {
    const date = getLocalDate()
    setCheckedIn(!!getPrayerCheckinForDateAndPrayer(date, prayerKey))
  }, [prayerKey])

  const handleCheckin = () => {
    if (checkedIn) return
    savePrayerCheckin({
      date: getLocalDate(),
      prayer: prayerKey,
      prayerLabel,
      adhanTime: adhanTime ?? '',
    })
    setCheckedIn(true)
  }

  const handleTasbih = () => {
    router.replace('/dhikr', { scroll: false })
  }

  // Before adhan: show subtle pre-adhan label
  if (!adhanPast) {
    return (
      <p
        className="text-center text-[0.58rem] font-medium tracking-wide"
        style={{ color: '#9CA3AF' }}
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
          <p className="text-[0.58rem]" style={{ color: '#9CA3AF' }}>
            May Allah accept it.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onPointerDown={e => e.stopPropagation()}
          onClick={handleCheckin}
          className="w-full rounded-full py-1.5 text-[0.62rem] font-semibold tracking-wide transition-all active:scale-95"
          style={{
            background: 'rgba(79,111,82,0.13)',
            border: '1px solid rgba(79,111,82,0.28)',
            color: '#4F6F52',
          }}
        >
          I prayed at the masjid
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
    </div>
  )
}
