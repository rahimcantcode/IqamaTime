'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { dallasDate, dallasMinutes } from '@/lib/dallas-date'
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

function isPast(timeStr: string | null, now: Date): boolean {
  if (!timeStr) return false
  const parts = parseTime(timeStr)
  if (!parts) return false
  return parts[0] * 60 + parts[1] < dallasMinutes(now)
}

export default function Dashboard({ data, adhanTimes }: Props) {
  const router = useRouter()
  const [clock, setClock] = useState(() => new Date())
  useEffect(() => {
    const tick = setInterval(() => setClock(new Date()), 30000)
    const refresh = () => { if (document.visibilityState === 'visible') router.refresh() }
    const polling = setInterval(refresh, 300000)
    document.addEventListener('visibilitychange', refresh)
    return () => { clearInterval(tick); clearInterval(polling); document.removeEventListener('visibilitychange', refresh) }
  }, [router])
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

  const initialIndex = getNextPrayerIndex(timesForIndex, isFriday, clock)

  const cards: PrayerCardData[] = useMemo(() =>
    prayers.map(prayer => {
      const pKey = prayer.key

      const iqamaTimes: MasjidIqamaTime[] = visibleData.map(entry => {
        const pt = entry.prayer_times
        let iqama: string | null = null
        let iqama2: string | null = null
        let iqama3: string | null = null

        if (pt) {
          if (pKey === 'jummah') {
            iqama  = pt.jummah1 ?? null
            iqama2 = pt.jummah2 ?? null
            iqama3 = pt.jummah3 ?? null
          } else {
            iqama = pt[pKey as keyof typeof pt] as string | null
          }
        }

        return {
          masjid: entry,
          iqama,
          iqama2,
          iqama3,
          isPast: isPast(iqama, clock),
          stale: !!pt && pt.date !== dallasDate(),
          sourceUrl: pt?.source_url ?? entry.website_url,
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
    [prayers, visibleData, adhanTimes, jummahTime, isFriday, clock]
  )

  const nextPrayer = prayers[initialIndex]
  const nextTime   = timesForIndex[nextPrayer?.key === 'jummah' ? 'jummah' : nextPrayer?.key] ?? null


  return (
    <main className="relative min-h-screen overflow-x-clip bg-[--background]">
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
      />

      {!data.length && <p role="status" className="mx-5 rounded-xl bg-white p-4 text-sm">Prayer data is temporarily unavailable. Please check your masjid website.</p>}
      <FirstVisitGuide />
      <BottomNav />
    </main>
  )
}
