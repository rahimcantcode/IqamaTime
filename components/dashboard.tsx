'use client'

import { useState, useMemo, useCallback } from 'react'
import { MasjidWithPrayers, PrayerCardData, MasjidIqamaTime, PrayerKey, AdhanTimes } from '@/types'
import { getPrayersForDay, getNextPrayerIndex, parseTime } from '@/lib/prayer-utils'
import { isFridayToday } from '@/lib/utils'
import { useSettings } from '@/hooks/useSettings'
import AppHeader from './app-header'
import PrayerFocusRail from './prayer-focus-rail'
import SettingsSheet from './settings-sheet'
import BottomNav from './bottom-nav'
import FirstVisitGuide from './first-visit-guide'

interface Props {
  data: MasjidWithPrayers[]
  adhanTimes: AdhanTimes
}

function isPast(timeStr: string | null): boolean {
  if (!timeStr) return false
  const parts = parseTime(timeStr)
  if (!parts) return false
  const now = new Date()
  return parts[0] * 60 + parts[1] < now.getHours() * 60 + now.getMinutes()
}

export default function Dashboard({ data, adhanTimes }: Props) {
  const isFriday = isFridayToday()
  const prayers  = getPrayersForDay(isFriday)
  const { settings, loaded } = useSettings()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const visibleData = useMemo(() => {
    if (!loaded || settings.selectedMasjidIds.length === 0) return data
    return data.filter(d => settings.selectedMasjidIds.includes(d.id))
  }, [data, settings.selectedMasjidIds, loaded])

  const jummahTime = useMemo(() => {
    for (const entry of visibleData) {
      if (entry.prayer_times?.jummah1) return entry.prayer_times.jummah1
    }
    return null
  }, [visibleData])

  const timesForIndex = useMemo<Record<PrayerKey, string | null>>(() => ({
    fajr:    adhanTimes.fajr,
    dhuhr:   adhanTimes.dhuhr,
    asr:     adhanTimes.asr,
    maghrib: adhanTimes.maghrib,
    isha:    adhanTimes.isha,
    jummah:  jummahTime,
  }), [adhanTimes, jummahTime])

  const initialIndex = useMemo(
    () => getNextPrayerIndex(timesForIndex, isFriday),
    [timesForIndex, isFriday]
  )

  const cards: PrayerCardData[] = useMemo(() =>
    prayers.map(prayer => {
      const pKey = prayer.key

      const iqamaTimes: MasjidIqamaTime[] = visibleData.map(entry => {
        const pt = entry.prayer_times
        let iqama: string | null = null
        let iqama2: string | null = null

        if (pt) {
          if (pKey === 'jummah') {
            iqama  = pt.jummah1 ?? null
            iqama2 = pt.jummah2 ?? null
          } else {
            iqama = pt[pKey as keyof typeof pt] as string | null
          }
        }

        return {
          masjid: entry,
          iqama,
          iqama2,
          isPast: isPast(iqama),
        }
      })

      const adhanTime = pKey === 'jummah'
        ? jummahTime
        : adhanTimes[pKey as keyof AdhanTimes] ?? null

      return {
        prayer,
        adhanTime,
        iqamaTimes,
        isFriday,
      }
    }),
    [prayers, visibleData, adhanTimes, jummahTime, isFriday]
  )

  const nextPrayer = prayers[initialIndex]
  const nextTime   = timesForIndex[nextPrayer?.key === 'jummah' ? 'jummah' : nextPrayer?.key] ?? null

  const handleRefresh = useCallback(async () => {
    try {
      await fetch('/api/prayers', { cache: 'no-store' })
      window.location.reload()
    } catch {}
  }, [])

  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#FAFAF7]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-8%,rgba(143,174,147,0.14),transparent_34rem)]" />
      <div className="relative z-10">
        <AppHeader
          nextPrayerName={nextPrayer?.displayName ?? ''}
          nextPrayerTime={nextTime}
          onSettingsOpen={() => setSettingsOpen(true)}
        />

        <PrayerFocusRail
          cards={cards}
          initialIndex={initialIndex}
        />
      </div>

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        masjids={data.map(d => d)}
        onRefresh={handleRefresh}
      />

      <FirstVisitGuide />
      <BottomNav />
    </main>
  )
}
