'use client'

import { useEffect, useState, useRef } from 'react'
import { useHydrated } from '@/hooks/useHydrated'
import * as Dialog from '@radix-ui/react-dialog'
import { Lock, UserRound, X } from 'lucide-react'
import { createPrivateProfile, loginPrivateProfile, PrivateUserSession } from '@/lib/private-auth'

interface Props {
  open: boolean
  reason?: string
  onClose: () => void
  onSuccess?: (session: PrivateUserSession) => void
}

export default function PrivateAuthModal({ open, reason, onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<'login' | 'create'>('login')
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const mounted = useHydrated()
  const request = useRef<AbortController | null>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const usernameInput = useRef<HTMLInputElement | null>(null)

  useEffect(() => () => {
    request.current?.abort()
    request.current = null
  }, [open])

  const close = () => {
    request.current?.abort()
    request.current = null
    setLoading(false)
    setPin('')
    setError('')
    onClose()
  }

  if (!open || !mounted) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (request.current) return
    const controller = new AbortController()
    request.current = controller
    setError('')
    setLoading(true)

    try {
      const session = mode === 'create'
        ? await createPrivateProfile(username, pin, controller.signal)
        : await loginPrivateProfile(username, pin, controller.signal)

      if (controller.signal.aborted) return
      setUsername('')
      setPin('')
      onSuccess?.(session)
      onClose()
    } catch (err) {
      if (controller.signal.aborted) return
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      if (request.current === controller) {
        request.current = null
        setLoading(false)
      }
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={value => { if (!value) close() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[9999] bg-black/20 backdrop-blur-sm" />
        <Dialog.Content
          aria-modal="true"
          onOpenAutoFocus={event => {
            returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
            event.preventDefault()
            usernameInput.current?.focus()
          }}
          onCloseAutoFocus={event => {
            event.preventDefault()
            if (returnFocus.current?.isConnected) returnFocus.current.focus()
          }}
          className="fixed bottom-[max(env(safe-area-inset-bottom),1rem)] left-1/2 z-[10000] w-[calc(100%_-_2rem)] max-h-[calc(100dvh_-_2rem)] max-w-sm -translate-x-1/2 overflow-y-auto rounded-[1.8rem] border bg-white sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2"
          style={{ borderColor: 'var(--border)', boxShadow: '0 20px 60px rgba(31,41,55,0.22)' }}
        >
        <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-5">
          <div>
            <div
              className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl"
              style={{ background: 'rgba(79,111,82,0.11)', color: '#4F6F52' }}
            >
              <Lock className="h-5 w-5" />
            </div>
            <Dialog.Title className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {mode === 'create' ? 'Create your private profile' : 'Log in to your profile'}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {reason ?? 'Use a username and private PIN to save your personal progress.'}
            </Dialog.Description>
          </div>
          <button
            type="button"
            onClick={close}
            className="pressable rounded-full p-2"
            style={{ background: 'rgba(31,41,55,0.05)', color: 'var(--text-secondary)' }}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mx-5 mb-4 grid grid-cols-2 rounded-full p-1" style={{ background: 'rgba(31,41,55,0.06)' }}>
          {(['login', 'create'] as const).map(value => (
            <button
              key={value}
              type="button"
              disabled={loading}
              onClick={() => {
                setMode(value)
                setError('')
              }}
              className="rounded-full px-3 py-2 text-xs font-semibold transition-all"
              style={
                mode === value
                  ? { background: '#FFFFFF', color: 'var(--text-primary)', boxShadow: '0 1px 4px rgba(31,41,55,0.10)' }
                  : { color: 'var(--text-muted)' }
              }
            >
              {value === 'login' ? 'Log in' : 'Create'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-5">
          <label className="mb-3 block">
            <span className="mb-1 block text-[0.65rem] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>
              Username
            </span>
            <div className="flex items-center gap-2 rounded-2xl border px-3 py-3" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
              <UserRound className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
              <input
                ref={usernameInput}
                value={username}
                disabled={loading}
                required
                minLength={3}
                maxLength={24}
                onChange={e => setUsername(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
          </label>

          <label className="mb-3 block">
            <span className="mb-1 block text-[0.65rem] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>
              Private PIN
            </span>
            <div className="flex items-center gap-2 rounded-2xl border px-3 py-3" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
              <Lock className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
              <input
                value={pin}
                disabled={loading}
                required
                minLength={4}
                maxLength={6}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                type="password"
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
          </label>

          {error && (
            <p role="alert" className="mb-3 rounded-2xl px-3 py-2 text-xs" style={{ background: 'rgba(220,38,38,0.08)', color: '#B91C1C' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="pressable w-full rounded-full py-3 text-sm font-semibold disabled:opacity-60"
            style={{ background: '#4F6F52', color: '#FFFFFF' }}
          >
            {loading ? 'Please wait...' : mode === 'create' ? 'Create profile' : 'Log in'}
          </button>

          <p className="mt-3 text-center text-[0.62rem] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            No email needed for now. Your username and PIN keep your progress separate from other users.
          </p>
        </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
