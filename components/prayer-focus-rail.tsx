'use client'

import { useState } from 'react'
import { FocusRail, FocusRailItem } from '@/components/ui/focus-rail'
import CountdownDisplay from './countdown-display'
import MasjidList from './masjid-list'
import { PrayerCardData } from '@/types'
import { PRAYER_ACCENT } from '@/lib/prayer-utils'

// Unsplash images keyed by prayer — one per time-of-day feel
const PRAYER_IMAGES: Record<string, string> = {
  fajr:    'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=600&q=80&auto=format&fit=crop',
  dhuhr:   'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80&auto=format&fit=crop',
  asr:     'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&q=80&auto=format&fit=crop',
  maghrib: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80&auto=format&fit=crop',
  isha:    'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80&auto=format&fit=crop',
  jummah:  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=80&auto=format&fit=crop',
}

interface Props {
  cards: PrayerCardData[]
  initialIndex: number
}

export default function PrayerFocusRail({ cards, initialIndex }: Props) {
  const [activeIdx, setActiveIdx] = useState(initialIndex)
  const activeCard = cards[activeIdx] ?? cards[0]
  const accent = PRAYER_ACCENT[activeCard.prayer.key]

  const items: FocusRailItem[] = cards.map((card) => ({
    id:          card.prayer.key,
    title:       card.prayer.displayName,
    meta:        card.prayer.arabicName,
    description: card.adhanTime ? `Adhan · ${card.adhanTime}` : undefined,
    imageSrc:    PRAYER_IMAGES[card.prayer.key] ?? PRAYER_IMAGES.fajr,
  }))

  return (
    <div className="flex flex-col">
      <FocusRail
        items={items}
        initialIndex={initialIndex}
        onActiveChange={setActiveIdx}
        loop
      />

      {/* Countdown to adhan */}
      <div className="flex justify-center py-8 border-t border-white/5">
        <CountdownDisplay targetTime={activeCard.adhanTime} accentColor={accent} />
      </div>

      {/* Iqama times by masjid */}
      <div className="px-4 pb-12">
        <div className="mb-3 h-px mx-4" style={{ background: `linear-gradient(to right, transparent, ${accent}33, transparent)` }} />
        <p className="text-xs font-semibold tracking-widest uppercase text-white/30 px-4 mb-2">
          Iqama Times
        </p>
        <MasjidList
          iqamaTimes={activeCard.iqamaTimes}
          isJummah={activeCard.prayer.key === 'jummah'}
          accentColor={accent}
        />
      </div>
    </div>
  )
}
