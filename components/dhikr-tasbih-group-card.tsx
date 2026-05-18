'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { RepeatableItem } from '@/lib/dhikr-data'

interface Props {
  items: RepeatableItem[]
  mode: 'simple' | 'interactive'
}

export default function DhikrTasbihGroupCard({ items, mode }: Props) {
  // Interactive mode state
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [count, setCount]           = useState(0)
  const [advancing, setAdvancing]   = useState(false)
  const advanceTimerRef             = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Simple mode state — parallel counts per item
  const [simpleCounts, setSimpleCounts] = useState<number[]>(() => items.map(() => 0))

  const allComplete   = phaseIndex >= items.length
  const currentItem   = items[Math.min(phaseIndex, items.length - 1)]
  const progress      = allComplete ? 1 : Math.min(count / currentItem.targetCount, 1)
  const phaseComplete = !allComplete && count >= currentItem.targetCount

  const increment = useCallback(() => {
    if (allComplete || advancing || phaseComplete) return

    const nextCount = count + 1
    setCount(nextCount)

    if (nextCount < currentItem.targetCount) return
    setAdvancing(true)
    advanceTimerRef.current = setTimeout(() => {
      setPhaseIndex(i => i + 1)
      setCount(0)
      setAdvancing(false)
      advanceTimerRef.current = null
    }, 700)
  }, [allComplete, advancing, count, currentItem.targetCount, phaseComplete])

  useEffect(() => () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
  }, [])

  const reset = useCallback(() => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
    setPhaseIndex(0)
    setCount(0)
    setAdvancing(false)
  }, [])

  const simpleIncrement = useCallback((i: number) => {
    setSimpleCounts(prev => {
      const next = [...prev]
      if (next[i] < items[i].targetCount) next[i]++
      return next
    })
  }, [items])

  const simpleReset = useCallback((i: number) => {
    setSimpleCounts(prev => {
      const next = [...prev]
      next[i] = 0
      return next
    })
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (mode === 'interactive') increment()
    }
  }

  const fillColor     = 'rgba(200,169,81,0.15)'
  const fillColorFull = 'rgba(200,169,81,0.30)'

  // ── SIMPLE MODE ──────────────────────────────────────────────
  if (mode === 'simple') {
    return (
      <div
        className="flex flex-col rounded-[1.2rem] overflow-hidden"
        style={{ background: '#FFFFFF', border: '1px solid #E7E2D8', boxShadow: '0 1px 4px rgba(31,41,55,0.05)' }}
      >
        {items.map((item, i) => {
          const c    = simpleCounts[i]
          const done = c >= item.targetCount
          return (
            <div
              key={item.id}
              className={`flex flex-col gap-2 p-4 ${i < items.length - 1 ? 'border-b border-[#E7E2D8]' : ''}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {item.arabic && (
                    <p
                      className="text-base leading-snug mb-0.5"
                      style={{ fontFamily: 'Georgia, serif', direction: 'rtl', color: done ? item.accent : 'rgba(32,33,36,0.75)' }}
                    >
                      {item.arabic}
                    </p>
                  )}
                  <p className="text-xs font-semibold" style={{ color: done ? item.accent : '#202124' }}>
                    {item.transliteration}
                  </p>
                  <p className="text-[0.6rem] mt-0.5" style={{ color: '#9CA3AF' }}>{item.translation}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onPointerDown={e => e.stopPropagation()}
                    onClick={() => simpleReset(i)}
                    disabled={c === 0}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold transition-all active:scale-90 disabled:opacity-30"
                    style={{ background: 'rgba(31,41,55,0.06)', color: '#6B7280' }}
                    aria-label="Reset count"
                  >
                    ×
                  </button>
                  <div className="flex flex-col items-center min-w-[2.5rem]">
                    <span className="text-xl font-bold tabular-nums" style={{ color: done ? item.accent : '#202124' }}>{c}</span>
                    <span className="text-[0.55rem]" style={{ color: '#9CA3AF' }}>of {item.targetCount}</span>
                  </div>
                  <button
                    onPointerDown={e => e.stopPropagation()}
                    onClick={() => simpleIncrement(i)}
                    disabled={done}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold transition-all active:scale-90 disabled:opacity-40"
                    style={{ background: `${item.accent}18`, border: `1px solid ${item.accent}30`, color: item.accent }}
                    aria-label="Increment count"
                  >
                    +
                  </button>
                </div>
              </div>

              {done && (
                <p className="text-[0.6rem] font-semibold" style={{ color: item.accent }}>✓ Complete</p>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // ── INTERACTIVE MODE ─────────────────────────────────────────
  return (
    <div
      role="button"
      tabIndex={0}
      className="relative overflow-hidden rounded-[1.2rem] cursor-pointer select-none"
      style={{
        minHeight: 188,
        background: '#FFFFFF',
        border: `1px solid ${allComplete ? '#C8A95135' : '#E7E2D8'}`,
        boxShadow: '0 1px 4px rgba(31,41,55,0.05)',
      }}
      onClick={allComplete ? undefined : increment}
      onKeyDown={handleKeyDown}
      aria-label={`Tasbih group: ${currentItem.transliteration}, ${count} of ${currentItem.targetCount}`}
    >
      {/* Liquid fill */}
      <motion.div
        className="absolute inset-x-0 bottom-0"
        animate={{ height: `${progress * 100}%` }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        style={{ background: allComplete ? fillColorFull : fillColor }}
      >
        {!allComplete && progress > 0 && (
          <motion.div
            className="absolute inset-x-0 top-0 h-2"
            style={{ background: fillColor, borderRadius: '50% 50% 0 0 / 4px 4px 0 0' }}
            animate={{ scaleX: [1, 1.06, 0.97, 1.03, 1] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </motion.div>

      {/* Reset button while in progress */}
      {count > 0 && !allComplete && !phaseComplete && (
        <button
          type="button"
          className="absolute right-2 top-2 z-20 flex h-5 w-5 items-center justify-center rounded-full text-[0.65rem] font-bold transition-all active:scale-90"
          style={{ background: 'rgba(31,41,55,0.08)', color: '#9CA3AF' }}
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); reset() }}
          aria-label="Reset tasbih"
        >
          ×
        </button>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-3 p-5 text-center">

        {/* Phase indicator pills */}
        <div className="flex items-center gap-2">
          {items.map((item, i) => {
            const isCompleted = i < phaseIndex || allComplete
            const isCurrent   = i === phaseIndex && !allComplete
            return (
              <motion.div
                key={item.id}
                animate={{
                  width: isCurrent ? 24 : 8,
                  opacity: i > phaseIndex && !allComplete ? 0.28 : 1,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="h-2 rounded-full"
                style={{ background: isCompleted || isCurrent ? '#C8A951' : '#D1D5DB' }}
              />
            )
          })}
        </div>

        {/* Phase content — animated on change */}
        <AnimatePresence mode="wait">
          <motion.div
            key={allComplete ? 'done' : phaseIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col items-center gap-1.5"
          >
            {currentItem.arabic && (
              <p
                className="text-2xl leading-snug"
                style={{
                  fontFamily: 'Georgia, serif',
                  direction: 'rtl',
                  color: allComplete ? '#C8A951' : 'rgba(32,33,36,0.82)',
                }}
              >
                {currentItem.arabic}
              </p>
            )}
            <p className="text-sm font-semibold" style={{ color: allComplete ? '#C8A951' : '#202124' }}>
              {currentItem.transliteration}
            </p>
            <p className="text-[0.6rem]" style={{ color: '#9CA3AF' }}>
              {currentItem.translation}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Count / all-complete state */}
        {allComplete ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold" style={{ color: '#C8A951' }}>✓</span>
              <span className="text-xs font-semibold" style={{ color: '#C8A951' }}>All Complete</span>
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
              aria-label="Reset tasbih counter"
            >
              <RotateCcw className="h-2.5 w-2.5" />
              Reset
            </button>
          </div>
        ) : (
          <p className="text-sm font-bold tabular-nums" style={{ color: '#C8A951' }}>
            {count} / {currentItem.targetCount}
          </p>
        )}
      </div>
    </div>
  )
}
