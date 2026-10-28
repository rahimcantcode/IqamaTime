'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import type { RepeatableItem } from '@/lib/dhikr-data'
import DhikrText from './dhikr-text'

interface Props {
  item: RepeatableItem
  mode: 'simple' | 'interactive'
  position?: number
}

export default function DhikrLiquidCard({ item, mode, position }: Props) {
  const [count, setCount] = useState(0)
  const cardRef = useRef<HTMLElement | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const completed = count >= item.targetCount
  const progress = Math.min(count / item.targetCount, 1)

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const increment = useCallback(() => {
    if (completed) return
    const next = Math.min(count + 1, item.targetCount)
    setCount(next)
    if (next === item.targetCount && mode === 'interactive') {
      timerRef.current = setTimeout(() => {
        const nextCard = cardRef.current?.nextElementSibling as HTMLElement | null
        if (!nextCard) return
        window.scrollTo({
          top: Math.max(nextCard.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.2, 0),
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        })
      }, 300)
    }
  }, [completed, count, item.targetCount, mode])

  const reset = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setCount(0)
  }

  return (
    <article
      ref={cardRef}
      data-dhikr-card={item.id}
      className="relative isolate scroll-mt-[20vh] overflow-hidden rounded-2xl"
      style={{ background: 'var(--surface)', border: `1px solid ${completed ? item.accent + '60' : 'var(--border)'}`, boxShadow: '0 1px 4px rgba(31,41,55,0.05)' }}
    >
      {mode === 'interactive' && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 -z-10"
          animate={{ height: `${progress * 100}%` }}
          transition={{ type: 'spring', stiffness: 280, damping: 32 }}
          style={{ background: `${item.accent}${completed ? '26' : '14'}` }}
        />
      )}
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
          <span>{position ? `Remembrance ${position}` : 'Remembrance'}</span>
          <span className="rounded-full px-3 py-1" style={{ background: `${item.accent}12`, color: 'var(--accent-dark)' }}>
            Recite {item.targetCount === 1 ? 'once' : `${item.targetCount} times`}
          </span>
        </div>
        <DhikrText item={item} />
        <div className="flex min-h-11 items-center justify-between gap-3 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
          <span className="text-xs font-medium" style={{ color: completed ? 'var(--accent-dark)' : 'var(--text-muted)' }} aria-live="polite">
            {completed ? '✓ Complete' : mode === 'interactive' ? 'Tap card to count' : 'Your count'}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={reset}
              disabled={count === 0}
              className="relative z-30 flex h-11 w-11 items-center justify-center rounded-full disabled:opacity-30"
              style={{ background: 'rgba(31,41,55,0.06)', color: 'var(--text-secondary)' }}
              aria-label={`Reset ${item.transliteration} count`}
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <span className="whitespace-nowrap text-sm font-semibold tabular-nums" style={{ color: 'var(--accent-dark)' }}>{count} / {item.targetCount}</span>
            {mode === 'simple' && (
              <button type="button" onClick={increment} disabled={completed} className="relative z-30 h-11 w-11 rounded-full text-xl font-semibold disabled:opacity-30" style={{ background: `${item.accent}18`, color: 'var(--accent-dark)' }} aria-label={`Increment ${item.transliteration} count`}>+</button>
            )}
          </div>
        </div>
      </div>
      {mode === 'interactive' && (
        <button
          type="button"
          className="dhikr-count-button absolute inset-0 z-20 w-full cursor-pointer"
          onClick={increment}
          disabled={completed}
          aria-label={`${item.transliteration} counter, ${count} of ${item.targetCount} completed.`}
        />
      )}
    </article>
  )
}
