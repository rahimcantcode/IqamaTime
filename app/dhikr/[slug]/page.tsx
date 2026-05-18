'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, Clock } from 'lucide-react'
import { DHIKR_DETAIL_CONTENT } from '@/lib/dhikr-data'
import DhikrLiquidCard from '@/components/dhikr-liquid-card'
import DhikrTasbihGroupCard from '@/components/dhikr-tasbih-group-card'

type Mode = 'simple' | 'interactive'

export default function DhikrDetailPage() {
  const params  = useParams()
  const router  = useRouter()
  const slug    = typeof params.slug === 'string' ? params.slug : ''
  const detail  = DHIKR_DETAIL_CONTENT[slug]

  const [mode, setMode] = useState<Mode>('interactive')

  const fallbackTitle = useMemo(() =>
    slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    [slug]
  )

  const splitIndex = detail?.tasbihGroupIndex ?? detail?.items.length ?? 0

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-y-auto bg-[#FAFAF7] scrollbar-none scroll-momentum"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
    >
      {/* Back navigation */}
      <div className="flex items-center gap-2 px-4 pb-1 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="pressable flex items-center gap-1 rounded-full px-2 py-1.5"
          style={{ color: '#6B7280' }}
          aria-label="Go back"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="text-sm">Dhikr</span>
        </button>
      </div>

      <div className="flex-1 px-6 pb-32 pt-3">
        {/* Page title */}
        <div className="mb-5">
          <h1 className="text-xl font-bold" style={{ color: '#202124' }}>
            {detail?.title ?? fallbackTitle}
          </h1>
          {detail?.description && (
            <p className="mt-1 text-xs" style={{ color: '#6B7280' }}>
              {detail.description}
            </p>
          )}
        </div>

        {detail ? (
          <>
            {/* Simple | Interactive toggle */}
            <div
              className="mb-5 inline-flex rounded-full p-0.5"
              style={{ background: 'rgba(31,41,55,0.06)', border: '1px solid rgba(31,41,55,0.08)' }}
            >
              {(['simple', 'interactive'] as Mode[]).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className="rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-all duration-200"
                  style={
                    mode === m
                      ? { background: '#FFFFFF', color: '#202124', boxShadow: '0 1px 4px rgba(31,41,55,0.10)' }
                      : { background: 'transparent', color: '#9CA3AF' }
                  }
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Dhikr cards */}
            <div className="flex flex-col gap-4">
              {/* Items before tasbih group */}
              {detail.items.slice(0, splitIndex).map(item => (
                <DhikrLiquidCard key={item.id} item={item} mode={mode} />
              ))}

              {/* Tasbih group card (when present) */}
              {detail.tasbihGroup && (
                <DhikrTasbihGroupCard
                  key="tasbih-group"
                  items={detail.tasbihGroup}
                  mode={mode}
                />
              )}

              {/* Items after tasbih group */}
              {detail.items.slice(splitIndex).map(item => (
                <DhikrLiquidCard key={item.id} item={item} mode={mode} />
              ))}
            </div>

            {mode === 'interactive' && (
              <p
                className="mt-6 text-center text-[0.6rem]"
                style={{ color: '#9CA3AF' }}
              >
                Tap a card to count · tap again at completion to reset
              </p>
            )}
          </>
        ) : (
          /* Coming soon placeholder */
          <div
            className="flex flex-col items-center rounded-[1.35rem] px-6 py-10 text-center"
            style={{ background: '#FFFFFF', border: '1px solid #E7E2D8', boxShadow: '0 1px 4px rgba(31,41,55,0.05)' }}
          >
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: 'rgba(200,169,81,0.10)', border: '1px solid rgba(200,169,81,0.20)' }}
            >
              <Clock className="h-5 w-5" style={{ color: '#C8A951' }} />
            </div>
            <p className="mb-1 text-sm font-semibold" style={{ color: '#202124' }}>
              Content coming soon
            </p>
            <p className="max-w-[220px] text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>
              This section is being prepared with care. Check back soon.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
