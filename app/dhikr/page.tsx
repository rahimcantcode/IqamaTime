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
    accent: '#1ca094',
  },
  {
    id: 'alhamdulillah',
    arabic: 'الْحَمْدُ لِلَّهِ',
    transliteration: 'Alhamdulillah',
    meaning: 'All praise is due to Allah',
    target: 33,
    category: 'After Salah',
    accent: '#1ca094',
  },
  {
    id: 'allahuakbar',
    arabic: 'اللَّهُ أَكْبَرُ',
    transliteration: 'Allahu Akbar',
    meaning: 'Allah is the Greatest',
    target: 34,
    category: 'After Salah',
    accent: '#1ca094',
  },
  {
    id: 'lailaha',
    arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ',
    transliteration: 'La ilaha illallah',
    meaning: 'There is no god but Allah',
    target: 100,
    category: 'General',
    accent: '#d4af37',
  },
  {
    id: 'istighfar',
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    transliteration: 'Astaghfirullah',
    meaning: 'I seek forgiveness from Allah',
    target: 100,
    category: 'General',
    accent: '#d4af37',
  },
  {
    id: 'salawat',
    arabic: 'اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ',
    transliteration: 'Allahumma salli ala Muhammad',
    meaning: 'O Allah, send blessings upon Muhammad',
    target: 10,
    category: 'Salawat',
    accent: '#d4af37',
  },
  {
    id: 'morning',
    arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ',
    transliteration: "Asbahna wa asbahal mulku lillah",
    meaning: 'We have entered the morning and all sovereignty belongs to Allah',
    target: 1,
    category: 'Morning Adhkar',
    accent: '#1ca094',
  },
  {
    id: 'evening',
    arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ',
    transliteration: "Amsayna wa amsal mulku lillah",
    meaning: 'We have entered the evening and all sovereignty belongs to Allah',
    target: 1,
    category: 'Evening Adhkar',
    accent: '#d4af37',
  },
  {
    id: 'sleep',
    arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
    transliteration: "Bismika Allahumma amootu wa ahya",
    meaning: 'In Your name, O Allah, I die and I live',
    target: 1,
    category: 'Before Sleep',
    accent: '#1ca094',
  },
  {
    id: 'hasbunallah',
    arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
    transliteration: 'HasbunAllahu wa ni\'mal wakeel',
    meaning: 'Allah is sufficient for us and He is the best disposer of affairs',
    target: 7,
    category: 'General',
    accent: '#d4af37',
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
      className="fixed inset-0 flex flex-col bg-[#131925] overflow-y-auto scrollbar-none"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
    >
      {/* Header */}
      <div className="px-6 pt-2 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-5 h-5" style={{ color: '#d4af37' }} />
          <h1 className="text-xl font-bold text-white">Dhikr</h1>
        </div>
        <p className="text-xs text-white/30">Tap a card to count · tap again to reset</p>
      </div>

      {/* Cards by category */}
      <div className="flex-1 px-6 pt-4 pb-32">
        {categories.map(cat => (
          <section key={cat} className="mb-6">
            <p className="text-[0.65rem] font-semibold tracking-[0.18em] uppercase text-white/30 mb-3">
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
                    className="text-left rounded-2xl overflow-hidden transition-all duration-150 active:scale-[0.98]"
                    style={{
                      background: completed
                        ? `${dhikr.accent}18`
                        : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${completed ? dhikr.accent + '40' : 'rgba(255,255,255,0.06)'}`,
                    }}
                  >
                    {/* Progress bar */}
                    <div className="h-0.5 w-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div
                        className="h-full transition-all duration-300"
                        style={{ width: `${progress * 100}%`, background: dhikr.accent }}
                      />
                    </div>

                    <div className="px-4 py-3.5 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-xl mb-1 leading-snug"
                          style={{
                            fontFamily: 'Georgia, serif',
                            direction: 'rtl',
                            color: completed ? dhikr.accent : 'rgba(255,255,255,0.75)',
                          }}
                        >
                          {dhikr.arabic}
                        </p>
                        <p className="text-xs text-white/50 font-medium">{dhikr.transliteration}</p>
                        <p className="text-[0.6rem] text-white/25 mt-0.5">{dhikr.meaning}</p>
                      </div>

                      {/* Counter badge */}
                      <div className="shrink-0 flex flex-col items-center justify-center">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200"
                          style={{
                            background: completed ? `${dhikr.accent}30` : 'rgba(255,255,255,0.06)',
                            border: `1px solid ${completed ? dhikr.accent + '50' : 'rgba(255,255,255,0.08)'}`,
                          }}
                        >
                          {completed ? (
                            <span style={{ color: dhikr.accent }} className="text-xs font-bold">✓</span>
                          ) : (
                            <span className="text-xs font-bold text-white/60 tabular-nums">
                              {count}/{dhikr.target}
                            </span>
                          )}
                        </div>
                        {!completed && (
                          <Plus className="w-3 h-3 text-white/20 mt-1" />
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
