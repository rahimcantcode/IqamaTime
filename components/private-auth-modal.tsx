'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open || typeof document === 'undefined') return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open || !mounted) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const session = mode === 'create'
        ? await createPrivateProfile(username, pin)
        : await loginPrivateProfile(username, pin)

      setUsername('')
      setPin('')
      onSuccess?.(session)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/20 px-4 backdrop-blur-sm sm:items-center"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)' }}
    >
      <button
        type="button"
        aria-label="Close login modal"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
      />

      <div
        className="relative z-10 w-full max-w-sm overflow-hidden rounded-[1.8rem] border bg-white"
        style={{ borderColor: '#E7E2D8', boxShadow: '0 20px 60px rgba(31,41,55,0.22)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-5">
          <div>
            <div
              className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl"
              style={{ background: 'rgba(79,111,82,0.11)', color: '#4F6F52' }}
            >
              <Lock className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold" style={{ color: '#202124' }}>
              {mode === 'create' ? 'Create your private profile' : 'Log in to your profile'}
            </h2>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: '#6B7280' }}>
              {reason ?? 'Use a username and private PIN to save your personal progress.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="pressable rounded-full p-2"
            style={{ background: 'rgba(31,41,55,0.05)', color: '#6B7280' }}
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
              onClick={() => {
                setMode(value)
                setError('')
              }}
              className="rounded-full px-3 py-2 text-xs font-semibold transition-all"
              style={
                mode === value
                  ? { background: '#FFFFFF', color: '#202124', boxShadow: '0 1px 4px rgba(31,41,55,0.10)' }
                  : { color: '#9CA3AF' }
              }
            >
              {value === 'login' ? 'Log in' : 'Create'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-5">
          <label className="mb-3 block">
            <span className="mb-1 block text-[0.65rem] font-semibold uppercase tracking-[0.16em]" style={{ color: '#9CA3AF' }}>
              Username
            </span>
            <div className="flex items-center gap-2 rounded-2xl border px-3 py-3" style={{ borderColor: '#E7E2D8', background: '#FAFAF7' }}>
              <UserRound className="h-4 w-4" style={{ color: '#9CA3AF' }} />
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="rahim"
                autoCapitalize="none"
                autoCorrect="off"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                style={{ color: '#202124' }}
              />
            </div>
          </label>

          <label className="mb-3 block">
            <span className="mb-1 block text-[0.65rem] font-semibold uppercase tracking-[0.16em]" style={{ color: '#9CA3AF' }}>
              Private PIN
            </span>
            <div className="flex items-center gap-2 rounded-2xl border px-3 py-3" style={{ borderColor: '#E7E2D8', background: '#FAFAF7' }}>
              <Lock className="h-4 w-4" style={{ color: '#9CA3AF' }} />
              <input
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="4 to 6 digits"
                inputMode="numeric"
                type="password"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                style={{ color: '#202124' }}
              />
            </div>
          </label>

          {error && (
            <p className="mb-3 rounded-2xl px-3 py-2 text-xs" style={{ background: 'rgba(220,38,38,0.08)', color: '#B91C1C' }}>
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

          <p className="mt-3 text-center text-[0.62rem] leading-relaxed" style={{ color: '#9CA3AF' }}>
            No email needed for now. Your username and PIN keep your progress separate from other users.
          </p>
        </form>
      </div>
    </div>,
    document.body
  )
}
