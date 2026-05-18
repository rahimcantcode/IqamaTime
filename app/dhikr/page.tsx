'use client'

import { useState } from 'react'
import { BookOpen, Plus } from 'lucide-react'

interface DhikrItem {
  id: string
  arabic: string
  transliteration: string
  meaning: string
  target: number
  category: string
  accent: string
}

const DHIKR_LIST: DhikrItem[] = [
  {
    id: 'subhanallah',
    arabic: 'سُبْحَانَ اللَّهِ',
    transliteration: 'SubhanAllah',
    meaning: 'Glory be to Allah',
    target: 33,
    category: 'After Salah',
    accent: '#4F6F52',
  },
  {
    id: 'alhamdulillah',
    arabic: 'الْحَمْدُ لِلَّهِ',
    transliteration: 'Alhamdulillah',
    meaning: 'All praise is due to Allah',
    target: 33,
    category: 'After Salah',
    accent: '#4F6F52',
  },
  {
    id: 'allahuakbar',
    arabic: 'اللَّهُ أَكْبَرُ',
    transliteration: 'Allahu Akbar',
    meaning: 'Allah is the Greatest',
    target: 34,
    category: 'After Salah',
    accent: '#4F6F52',
  },
  {
    id: 'lailaha',
    arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ',
    transliteration: 'La ilaha illallah',
    meaning: 'There is no god but Allah',
    target: 100,
    category: 'General',
    accent: '#C8A951',
  },
  {
    id: 'istighfar',
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    transliteration: 'Astaghfirullah',
    meaning: 'I seek forgiveness from Allah',
    target: 100,
    category: 'General',
    accent: '#C8A951',
  },
  {
    id: 'salawat',
    arabic: 'اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ',
    transliteration: 'Allahumma salli ala Muhammad',
    meaning: 'O Allah, send blessings upon Muhammad',
    target: 10,
    category: 'Salawat',
    accent: '#C8A951',
  },
  {
    id: 'morning',
    arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ',
    transliteration: 'Asbahna wa asbahal mulku lillah',
    meaning: 'We have entered the morning and all sovereignty belongs to Allah',
    target: 1,
    category: 'Morning Adhkar',
    accent: '#4F6F52',
  },
  {
    id: 'evening',
    arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ',
    transliteration: 'Amsayna wa amsal mulku lillah',
    meaning: 'We have entered the evening and all sovereignty belongs to Allah',
    target: 1,
    category: 'Evening Adhkar',
    accent: '#C8A951',
  },
  {
    id: 'sleep',
    arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
    transliteration: 'Bismika Allahumma amootu wa ahya',
    meaning: 'In Your name, O Allah, I die and I live',
    target: 1,
    category: 'Before Sleep',
    accent: '#4F6F52',
  },
  {
    id: 'hasbunallah',
    arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
    transliteration: "HasbunAllahu wa ni'mal wakeel",
    meaning: 'Allah is sufficient for us and He is the best disposer of affairs',
    target: 7,
    category: 'General',
    accent: '#C8A951',
  },
]

export default function DhikrPage() {
  const [counts, setCounts] = useState<Record<string, number>>({})

  const increment = (id: string, target: number) => {
    setCounts(c => ({
      ...c,
      [id]: (c[id] ?? 0) < target ? (c[id] ?? 0) + 1 : 0,
    }))
  }

  const categories = Array.from(new Set(DHIKR_LIST.map(d => d.category)))

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-y-auto bg-[#FAFAF7] scrollbar-none scroll-momentum"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
    >
      {/* Header */}
      <div className="px-6 pb-2 pt-2">
        <div className="mb-1 flex items-center gap-2">
          <BookOpen className="w-5 h-5" style={{ color: '#C8A951' }} />
          <h1 className="text-xl font-bold" style={{ color: '#202124' }}>Dhikr</h1>
        </div>
        <p className="text-xs" style={{ color: '#6B7280' }}>Tap a card to count · tap again to reset</p>
      </div>

      {/* Cards by category */}
      <div className="flex-1 px-6 pb-32 pt-4">
        {categories.map(cat => (
          <section key={cat} className="mb-6">
            <p
              className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.18em]"
              style={{ color: '#9CA3AF' }}
            >
              {cat}
            </p>
            <div className="flex flex-col gap-3">
              {DHIKR_LIST.filter(d => d.category === cat).map(dhikr => {
                const count     = counts[dhikr.id] ?? 0
                const completed = count >= dhikr.target
                const progress  = Math.min(count / dhikr.target, 1)

                return (
                  <button
                    key={dhikr.id}
                    onClick={() => increment(dhikr.id, dhikr.target)}
                    className="pressable overflow-hidden rounded-[1.2rem] text-left"
                    style={{
                      background: completed ? `${dhikr.accent}0D` : '#FFFFFF',
                      border: `1px solid ${completed ? dhikr.accent + '35' : '#E7E2D8'}`,
                      boxShadow: '0 1px 4px rgba(31,41,55,0.05)',
                    }}
                  >
                    {/* Progress bar */}
                    <div className="h-0.5 w-full" style={{ background: 'rgba(231,226,216,0.80)' }}>
                      <div
                        className="h-full transition-all duration-300"
                        style={{ width: `${progress * 100}%`, background: dhikr.accent }}
                      />
                    </div>

                    <div className="flex items-start justify-between gap-3 px-4 py-3.5">
                      <div className="min-w-0 flex-1">
                        <p
                          className="mb-1 text-xl leading-snug"
                          style={{
                            fontFamily: 'Georgia, serif',
                            direction: 'rtl',
                            color: completed ? dhikr.accent : 'rgba(32,33,36,0.88)',
                          }}
                        >
                          {dhikr.arabic}
                        </p>
                        <p className="text-xs font-medium" style={{ color: '#6B7280' }}>{dhikr.transliteration}</p>
                        <p className="mt-0.5 text-[0.6rem]" style={{ color: '#9CA3AF' }}>{dhikr.meaning}</p>
                      </div>

                      {/* Counter badge */}
                      <div className="flex shrink-0 flex-col items-center justify-center">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200"
                          style={{
                            background: completed ? `${dhikr.accent}18` : 'rgba(231,226,216,0.60)',
                            border: `1px solid ${completed ? dhikr.accent + '40' : '#E7E2D8'}`,
                          }}
                        >
                          {completed ? (
                            <span style={{ color: dhikr.accent }} className="text-xs font-bold">✓</span>
                          ) : (
                            <span className="text-xs font-bold tabular-nums" style={{ color: '#6B7280' }}>
                              {count}/{dhikr.target}
                            </span>
                          )}
                        </div>
                        {!completed && (
                          <Plus className="mt-1 h-3 w-3" style={{ color: '#9CA3AF' }} />
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
