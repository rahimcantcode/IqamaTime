'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useHydrated } from '@/hooks/useHydrated'
import * as Dialog from '@radix-ui/react-dialog'
import {
  Share,
  SquarePlus,
  Home,
  MapPin,
  BarChart3,
  Lock,
  ChevronRight,
  Check,
  Clock,
  Sparkles,
  X,
} from 'lucide-react'
import { getPrivateSession, subscribeToPrivateAuth } from '@/lib/private-auth'

const ONBOARDING_KEY = 'iqamatime:first-visit-guide-complete'

const steps = [
  {
    eyebrow: 'Welcome',
    title: 'IqamaTime helps you pray at the masjid',
    description:
      'Use the app to check iqama times, read dhikr, discover masjid updates, and track your masjid prayer progress in a simple personal dashboard.',
    icon: Sparkles,
    accent: '#4F6F52',
    details: [
      { icon: Clock, text: 'See prayer and iqama times quickly' },
      { icon: MapPin, text: 'Follow masjid updates and events' },
      { icon: BarChart3, text: 'Track your progress when you pray at the masjid' },
    ],
  },
  {
    eyebrow: 'Best setup',
    title: 'Add it to your iPhone Home Screen',
    description:
      'Since this is shared as a link, it works best when you save it like a real app. Open it in Safari, tap Share, then choose Add to Home Screen.',
    icon: Home,
    accent: '#C8A951',
    details: [
      { icon: Share, text: 'Tap the Share button in Safari' },
      { icon: SquarePlus, text: 'Choose Add to Home Screen' },
      { icon: Home, text: 'Open it from your Home Screen' },
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
      { icon: BarChart3, text: 'Watch your consistency build over time' },
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

export function shouldAutoOpenGuide(autoOpen: boolean, controlled: boolean, alreadySeen: boolean, loggedIn: boolean) {
  return autoOpen && !controlled && !alreadySeen && !loggedIn
}

export function guideStepIndex(current: number, direction: -1 | 1, count: number) {
  return Math.max(0, Math.min(current + direction, count - 1))
}

interface Props {
  autoOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function FirstVisitGuide({ autoOpen = true, open: controlledOpen, onOpenChange }: Props = {}) {
  const mounted = useHydrated()
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const returnFocus = useRef<HTMLElement | null>(null)
  const nextButton = useRef<HTMLButtonElement | null>(null)
  const setOpen = useCallback((value: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(value)
    onOpenChange?.(value)
  }, [controlledOpen, onOpenChange])
  const [stepIndex, setStepIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)

  useEffect(() => {
    if (!mounted || !autoOpen || controlledOpen !== undefined) return
    const evaluate = () => {
      let alreadySeen = false
      try { alreadySeen = localStorage.getItem(ONBOARDING_KEY) === 'true' } catch { /* Guide remains usable without storage. */ }
      if (shouldAutoOpenGuide(autoOpen, false, alreadySeen, !!getPrivateSession())) setOpen(true)
    }
    const timer = window.setTimeout(evaluate, 0)
    const unsubscribe = subscribeToPrivateAuth(evaluate)
    return () => { window.clearTimeout(timer); unsubscribe() }
  }, [mounted, autoOpen, controlledOpen, setOpen])

  useEffect(() => {
    // Settings uses its own controlled instance; global requests are handled
    // only by the dashboard instance, preventing duplicate dialogs.
    if (controlledOpen !== undefined) return
    const handler = () => {
      setStepIndex(0)
      setOpen(true)
    }
    window.addEventListener('iqamatime:open-guide', handler)
    return () => window.removeEventListener('iqamatime:open-guide', handler)
  }, [controlledOpen, setOpen])

  const current = steps[stepIndex]
  const isLast = stepIndex === steps.length - 1
  const Icon = current.icon

  const progress = ((stepIndex + 1) / steps.length) * 100

  if (!mounted || !open) return null

  const close = () => {
    try { localStorage.setItem(ONBOARDING_KEY, 'true') } catch { /* Dismiss even if storage is blocked. */ }
    setOpen(false)
    setStepIndex(0)
    setTouchStart(null)
  }

  const goNext = () => {
    if (isLast) {
      close()
      return
    }
    setStepIndex(i => guideStepIndex(i, 1, steps.length))
  }

  const goBack = () => setStepIndex(i => guideStepIndex(i, -1, steps.length))

  const handleTouchEnd = (clientX: number) => {
    if (touchStart === null) return
    const delta = clientX - touchStart
    setTouchStart(null)

    if (delta < -45) goNext()
    if (delta > 45) goBack()
  }

  return (
    <Dialog.Root open={open} onOpenChange={value => { if (!value) close() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-md" />
        <Dialog.Content
          aria-modal="true"
          className="fixed bottom-[max(env(safe-area-inset-bottom),1rem)] left-1/2 z-[9999] max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-sm -translate-x-1/2 overflow-y-auto rounded-[2rem] border bg-white sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2"
          style={{ borderColor: 'var(--border)', boxShadow: '0 24px 70px rgba(31,41,55,0.24)' }}
          onOpenAutoFocus={event => {
            returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
            event.preventDefault()
            nextButton.current?.focus()
          }}
          onCloseAutoFocus={event => {
            event.preventDefault()
            if (returnFocus.current?.isConnected) returnFocus.current.focus()
          }}
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
            <div className="flex items-center gap-1.5" aria-hidden="true">
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
            <button type="button" onClick={close} aria-label="Close guide" className="pressable rounded-full p-2" style={{ color: 'var(--text-secondary)', background: 'rgba(31,41,55,0.05)' }}>
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="sr-only" role="status">Step {stepIndex + 1} of {steps.length}</p>
          <p
            className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em]"
            style={{ color: current.accent }}
          >
            {current.eyebrow}
          </p>
          <Dialog.Title className="text-2xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
            {current.title}
          </Dialog.Title>
          <Dialog.Description className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {current.description}
          </Dialog.Description>

          <div className="mt-5 space-y-2.5">
            {current.details.map(({ icon: DetailIcon, text }) => (
              <div
                key={text}
                className="flex items-center gap-3 rounded-2xl border px-3 py-3"
                style={{ background: 'var(--background)', borderColor: 'var(--border)' }}
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

          <div role="progressbar" aria-label="Guide progress" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={stepIndex + 1} className="mt-6 h-1.5 overflow-hidden rounded-full" style={{ background: 'rgba(231,226,216,0.9)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, background: current.accent }}
            />
          </div>

          <button
            ref={nextButton}
            type="button"
            onClick={goNext}
            className="pressable mt-5 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold"
            style={{ background: '#4F6F52', color: '#FFFFFF' }}
          >
            {isLast ? 'Done' : 'Next'}
            {isLast ? <Check className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          <button type="button" onClick={goBack} disabled={stepIndex === 0} className="mt-3 w-full rounded-full py-2 text-xs font-semibold disabled:opacity-40" style={{ color: 'var(--text-secondary)' }}>
            Back
          </button>
          <p className="mt-3 text-center text-[0.62rem]" style={{ color: 'var(--text-muted)' }}>
            Swipe left or tap Next
          </p>
        </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
