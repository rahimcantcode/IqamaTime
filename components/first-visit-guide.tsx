'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Share,
  SquarePlus,
  Home,
  MapPin,
  BarChart3,
  Lock,
  ChevronRight,
  Check,
} from 'lucide-react'
import { getPrivateSession, subscribeToPrivateAuth } from '@/lib/private-auth'

const ONBOARDING_KEY = 'iqamatime:first-visit-guide-complete'

const steps = [
  {
    eyebrow: 'First step',
    title: 'Add it to your iPhone Home Screen',
    description:
      'This app works best when it feels like a real app. Open it in Safari, tap Share, then choose Add to Home Screen.',
    icon: Home,
    accent: '#C8A951',
    details: [
      { icon: Share, text: 'Tap the Share button in Safari' },
      { icon: SquarePlus, text: 'Choose Add to Home Screen' },
      { icon: Home, text: 'Open it like a normal app' },
    ],
  },
  {
    eyebrow: 'Mission',
    title: 'A gentle push toward the masjid',
    description:
      'The goal is simple: help us do our best to pray at the masjid more often, one salah at a time.',
    icon: MapPin,
    accent: '#4F6F52',
    details: [
      { icon: MapPin, text: 'Check nearby iqama times' },
      { icon: Check, text: 'Tap “I prayed at the masjid” after salah' },
      { icon: BarChart3, text: 'Watch your progress build over time' },
    ],
  },
  {
    eyebrow: 'Private profile',
    title: 'Log in only when you save personal progress',
    description:
      'Prayer times, updates, and dhikr are open. Progress and preferences need a private username and PIN so your data stays yours.',
    icon: Lock,
    accent: '#4F6F52',
    details: [
      { icon: Lock, text: 'No email needed for now' },
      { icon: BarChart3, text: 'Your dashboard stays personal' },
      { icon: Check, text: 'Stay logged in after your first login' },
    ],
  },
]

export default function FirstVisitGuide() {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const evaluate = () => {
      const alreadySeen = localStorage.getItem(ONBOARDING_KEY) === 'true'
      const loggedIn = !!getPrivateSession()
      setOpen(!alreadySeen && !loggedIn)
    }

    evaluate()
    return subscribeToPrivateAuth(evaluate)
  }, [mounted])

  useEffect(() => {
    if (!open || typeof document === 'undefined') return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  const current = steps[stepIndex]
  const isLast = stepIndex === steps.length - 1
  const Icon = current.icon

  const progress = useMemo(() => ((stepIndex + 1) / steps.length) * 100, [stepIndex])

  if (!mounted || !open) return null

  const goNext = () => {
    if (isLast) {
      localStorage.setItem(ONBOARDING_KEY, 'true')
      setOpen(false)
      return
    }
    setStepIndex(i => Math.min(i + 1, steps.length - 1))
  }

  const goBack = () => {
    setStepIndex(i => Math.max(i - 1, 0))
  }

  const handleTouchEnd = (clientX: number) => {
    if (touchStart === null) return
    const delta = clientX - touchStart
    setTouchStart(null)

    if (delta < -45) goNext()
    if (delta > 45) goBack()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9998] flex items-end justify-center bg-black/20 px-4 backdrop-blur-md sm:items-center"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)' }}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-[2rem] border bg-white"
        style={{ borderColor: '#E7E2D8', boxShadow: '0 24px 70px rgba(31,41,55,0.24)' }}
        onTouchStart={e => setTouchStart(e.changedTouches[0]?.clientX ?? null)}
        onTouchEnd={e => handleTouchEnd(e.changedTouches[0]?.clientX ?? 0)}
      >
        <div className="px-5 pb-5 pt-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: `${current.accent}18`, color: current.accent }}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex items-center gap-1.5">
              {steps.map((_, index) => (
                <span
                  key={index}
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: index === stepIndex ? 22 : 8,
                    background: index === stepIndex ? current.accent : 'rgba(156,163,175,0.28)',
                  }}
                />
              ))}
            </div>
          </div>

          <p
            className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em]"
            style={{ color: current.accent }}
          >
            {current.eyebrow}
          </p>
          <h2 className="text-2xl font-bold leading-tight" style={{ color: '#202124' }}>
            {current.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: '#6B7280' }}>
            {current.description}
          </p>

          <div className="mt-5 space-y-2.5">
            {current.details.map(({ icon: DetailIcon, text }) => (
              <div
                key={text}
                className="flex items-center gap-3 rounded-2xl border px-3 py-3"
                style={{ background: '#FAFAF7', borderColor: '#E7E2D8' }}
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${current.accent}14`, color: current.accent }}
                >
                  <DetailIcon className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium" style={{ color: '#374151' }}>
                  {text}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 h-1.5 overflow-hidden rounded-full" style={{ background: 'rgba(231,226,216,0.9)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, background: current.accent }}
            />
          </div>

          <button
            type="button"
            onClick={goNext}
            className="pressable mt-5 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold"
            style={{ background: '#4F6F52', color: '#FFFFFF' }}
          >
            {isLast ? 'Done' : 'Next'}
            {isLast ? <Check className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          <p className="mt-3 text-center text-[0.62rem]" style={{ color: '#9CA3AF' }}>
            Swipe left or tap Next
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}
