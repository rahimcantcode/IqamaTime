'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, Circle } from 'lucide-react'
import { Masjid } from '@/types'
import { useSettings } from '@/hooks/useSettings'
import PrivateAuthModal from '@/components/private-auth-modal'

interface Props {
  open: boolean
  onClose: () => void
  masjids: Masjid[]
}

export default function SettingsSheet({ open, onClose, masjids }: Props) {
  const { settings, updateSettings, toggleMasjid, saving, loaded, syncError, requiresLogin, clearLoginRequirement } = useSettings()

  const allSelected = settings.selectedMasjidIds.length === 0

  return (
    <>
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 backdrop-blur-sm"
            style={{ background: 'rgba(31,41,55,0.18)' }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 36 }}
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col overflow-hidden rounded-t-[2rem]"
            style={{
              maxHeight: '84vh',
              background: '#FFFFFF',
              borderTop: '1px solid #E7E2D8',
              boxShadow: '0 -8px 40px rgba(31,41,55,0.10)',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="h-1 w-10 rounded-full" style={{ background: 'var(--border)' }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h2>
              <button
                onClick={onClose}
                className="rounded-xl p-2 transition-colors active:scale-95"
                style={{ background: 'rgba(31,41,55,0.06)', border: '1px solid rgba(31,41,55,0.08)' }}
                aria-label="Close settings"
              >
                <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 pb-safe scroll-momentum">

              {/* Masjid selection */}
              <section className="mb-8">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                    Favorite Masjids
                  </p>
                  {!allSelected && (
                    <button
                      onClick={() => void updateSettings({ selectedMasjidIds: [] })}
                      disabled={!loaded || saving}
                      className="text-xs font-medium"
                      style={{ color: '#4F6F52' }}
                    >
                      Show All
                    </button>
                  )}
                </div>

                <p className="mb-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {allSelected
                    ? 'Showing all masjids. Tap to filter.'
                    : `${settings.selectedMasjidIds.length} selected`
                  }
                </p>

                {syncError && <p role="alert" className="mb-3 text-xs text-red-700">{syncError}</p>}
                <div className="flex flex-col gap-2">
                  {masjids.map(masjid => {
                    const selected = allSelected || settings.selectedMasjidIds.includes(masjid.id)
                    return (
                      <button
                        key={masjid.id}
                        onClick={() => toggleMasjid(masjid.id)}
                        disabled={!loaded || saving}
                        className="pressable flex min-h-[70px] items-center justify-between rounded-[1.2rem] p-4 transition-colors"
                        style={{ background: 'var(--surface-soft)', border: '1px solid #E7E2D8' }}
                      >
                        <div className="min-w-0 pr-3 text-left">
                          <p className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {masjid.name}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{masjid.city}</p>
                        </div>
                        {selected
                          ? <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: '#4F6F52' }} />
                          : <Circle className="w-5 h-5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                        }
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* App info */}
              <div className="pb-6 text-center">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  IqamaTime · Refreshed daily after midnight CT
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    <PrivateAuthModal open={requiresLogin} onClose={clearLoginRequirement} reason="Log in before saving masjid preferences." />
    </>
  )
}
