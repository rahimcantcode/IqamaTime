'use client'

import { useMemo } from 'react'
import { PrayerKey } from '@/types'
import { getPrayersForDay, getNextPrayerIndex, parseTime } from '@/lib/prayer-utils'

interface PrayerTimesMap {
  fajr?: string | null
  dhuhr?: string | null
  asr?: string | null
  maghrib?: string | null
  isha?: string | null
  jummah1?: string | null
  jummah2?: string | null
}

export function useNextPrayer(prayerTimesMap: PrayerTimesMap, isFriday: boolean) {
  return useMemo(() => {
    const timesRecord: Record<PrayerKey, string | null> = {
      fajr:    prayerTimesMap.fajr    ?? null,
      dhuhr:   prayerTimesMap.dhuhr   ?? null,
      asr:     prayerTimesMap.asr     ?? null,
      maghrib: prayerTimesMap.maghrib  ?? null,
      isha:    prayerTimesMap.isha    ?? null,
      jummah:  prayerTimesMap.jummah1 ?? null,
    }
    const idx = getNextPrayerIndex(timesRecord, isFriday)
    const prayers = getPrayersForDay(isFriday)
    return { index: idx, prayer: prayers[idx] }
  }, [prayerTimesMap, isFriday])
}

/** Returns true if a prayer time string is in the past */
export function usePrayerIsPast(timeStr: string | null): boolean {
  if (!timeStr) return false
  const parts = parseTime(timeStr)
  if (!parts) return false
  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const prayerMinutes = parts[0] * 60 + parts[1]
  return prayerMinutes < nowMinutes
}
