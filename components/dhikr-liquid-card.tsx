'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { RepeatableItem } from '@/lib/dhikr-data'

interface Props {
  item: RepeatableItem
  mode: 'simple' | 'interactive'
}

export default function DhikrLiquidCard({ item, mode }: Props) {
  const [count, setCount] = useState(0)

  const completed = count >= item.targetCount
  const progress  = Math.min(count / item.targetCount, 1)

  const fillColor = item.accent === '#C8A951'
    ? 'rgba(200,169,81,0.16)'
    : 'rgba(79,111,82,0.13)'
  const fillColorFull = item.accent === '#C8A951'
    ? 'rgba(200,169,81,0.30)'
    : 'rgba(79,111,82,0.24)'

  const increment = useCallback(() => {
    if (!completed) setCount(c => c + 1)
  }, [completed])

  const reset = useCallback(() => setCount(0), [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (mode === 'interactive') increment()
    }
  }

  // ── SIMPLE MODE ──────────────────────────────────────────────
  if (mode === 'simple') {
    return (
      <div
        className="flex flex-col gap-4 rounded-[1.2rem] p-5"
        style={{ background: '#FFFFFF', border: '1px solid #E7E2D8', boxShadow: '0 1px 4px rgba(31,41,55,0.05)' }}
        aria-label={`${item.transliteration} counter, ${count} of ${item.targetCount} completed`}
      >
        {item.arabic && (
          <p
            lang="ar"
            dir="rtl"
            className="dhikr-arabic"
            style={{ color: 'rgba(32,33,36,0.78)' }}
          >
            {item.arabic}
          </p>
        )}
        <div className="text-center">
          <p className="text-sm font-semibold leading-relaxed" style={{ color: '#202124' }}>{item.transliteration}</p>
          <p className="mt-1 text-[0.68rem] leading-relaxed" style={{ color: '#9CA3AF' }}>{item.translation}</p>
        </div>

        {/* Counter row */}
        <div className="flex items-center justify-center gap-4">
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={reset}
            disabled={count === 0}
            className="flex h-8 w-8 items-center justify-center rounded-full text-base font-semibold transition-all active:scale-90 disabled:opacity-30"
            style={{ background: 'rgba(31,41,55,0.06)', color: '#6B7280' }}
            aria-label="Reset count"
          >
            ×
          </button>

          <div className="flex flex-col items-center">
            <span
              className="text-2xl font-bold tabular-nums"
              style={{ color: completed ? item.accent : '#202124' }}
            >
              {count}
            </span>
            <span className="text-[0.58rem] font-medium" style={{ color: '#9CA3AF' }}>
              of {item.targetCount}
            </span>
          </div>

          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={increment}
            disabled={completed}
            className="flex h-8 w-8 items-center justify-center rounded-full text-base font-bold transition-all active:scale-90 disabled:opacity-40"
            style={{ background: `${item.accent}18`, border: `1px solid ${item.accent}30`, color: item.accent }}
            aria-label="Increment count"
          >
            +
          </button>
        </div>

        {completed && (
          <p className="text-center text-[0.65rem] font-semibold" style={{ color: item.accent }}>
            ✓ Complete
          </p>
        )}
      </div>
    )
  }

  // ── INTERACTIVE MODE (liquid fill) ───────────────────────────
  return (
    <div
      role="button"
      tabIndex={0}
      className="relative overflow-hidden rounded-[1.2rem] cursor-pointer select-none"
      style={{
        minHeight: 148,
        background: '#FFFFFF',
        border: `1px solid ${completed ? item.accent + '35' : '#E7E2D8'}`,
        boxShadow: '0 1px 4px rgba(31,41,55,0.05)',
      }}
      onClick={completed ? undefined : increment}
      onKeyDown={handleKeyDown}
      aria-label={`${item.transliteration} counter, ${count} of ${item.targetCount} completed.`}
    >
      {/* Liquid fill layer */}
      <motion.div
        className="absolute inset-x-0 bottom-0"
        animate={{ height: `${progress * 100}%` }}
        transition={{ type: 'spring', stiffness: 280, damping: 32 }}
        style={{ background: completed ? fillColorFull : fillColor }}
      >
        {/* Wave surface at top of fill */}
        {!completed && progress > 0 && (
          <motion.div
            className="absolute inset-x-0 top-0 h-2"
            style={{
              background: fillColor,
              borderRadius: '50% 50% 0 0 / 4px 4px 0 0',
            }}
            animate={{ scaleX: [1, 1.06, 0.97, 1.03, 1] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </motion.div>

      {/* Reset button — appears when count > 0, not completed */}
      {count > 0 && !completed && (
        <button
          type="button"
          className="absolute right-2 top-2 z-20 flex h-5 w-5 items-center justify-center rounded-full text-[0.65rem] font-bold transition-all active:scale-90"
          style={{ background: 'rgba(31,41,55,0.08)', color: '#9CA3AF' }}
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); reset() }}
          aria-label="Reset count"
        >
          ×
        </button>
      )}

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-3 p-5 text-center">
        {item.arabic && (
          <p
            lang="ar"
            dir="rtl"
            className="dhikr-arabic"
            style={{ color: completed ? item.accent : 'rgba(32,33,36,0.80)' }}
          >
            {item.arabic}
          </p>
        )}

        <div>
          <p className="text-sm font-semibold leading-relaxed" style={{ color: completed ? item.accent : '#202124' }}>
            {item.transliteration}
          </p>
          <p className="mt-1 text-[0.68rem] leading-relaxed" style={{ color: '#9CA3AF' }}>
            {item.translation}
          </p>
        </div>

        {completed ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span style={{ color: item.accent }} className="text-sm font-bold">✓</span>
              <span className="text-xs font-semibold" style={{ color: item.accent }}>Complete</span>
            </div>
            <button
              type="button"
              onPointerDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); reset() }}
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.58rem] font-medium transition-all active:scale-95"
              style={{
                background: 'rgba(31,41,55,0.06)',
                border: '1px solid rgba(31,41,55,0.10)',
                color: '#9CA3AF',
              }}
              aria-label="Reset counter"
            >
              <RotateCcw className="h-2.5 w-2.5" />
              Reset
            </button>
          </div>
        ) : (
          <p
            className="text-sm font-bold tabular-nums"
            style={{ color: item.accent }}
          >
            {count} / {item.targetCount}
          </p>
        )}
      </div>
    </div>
  )
}
