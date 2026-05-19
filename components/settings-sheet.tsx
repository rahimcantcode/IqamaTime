'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, RefreshCw, Bell, CheckCircle2, Circle, Moon, Sun, Monitor } from 'lucide-react'
import { Masjid } from '@/types'
import { useSettings } from '@/hooks/useSettings'
import { useTheme, type AppTheme } from '@/components/theme-provider'
import { useState } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  masjids: Masjid[]
  onRefresh: () => void
}

const themeOptions: { value: AppTheme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'Auto', icon: Monitor },
]

export default function SettingsSheet({ open, onClose, masjids, onRefresh }: Props) {
  const { settings, toggleMasjid } = useSettings()
  const { theme, setTheme } = useTheme()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await onRefresh()
    setTimeout(() => setRefreshing(false), 1500)
  }

  const allSelected = settings.selectedMasjidIds.length === 0

  return (
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
              <div className="h-1 w-10 rounded-full" style={{ background: '#E7E2D8' }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4">
              <h2 className="text-xl font-bold" style={{ color: '#202124' }}>Settings</h2>
              <button
                onClick={onClose}
                className="rounded-xl p-2 transition-colors active:scale-95"
                style={{ background: 'rgba(31,41,55,0.06)', border: '1px solid rgba(31,41,55,0.08)' }}
                aria-label="Close settings"
              >
                <X className="w-5 h-5" style={{ color: '#6B7280' }} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 pb-safe scroll-momentum">

              {/* Appearance */}
              <section className="mb-6">
                <p
                  className="mb-3 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: '#9CA3AF' }}
                >
                  Appearance
                </p>
                <div
                  className="grid grid-cols-3 gap-2 rounded-[1.25rem] p-1.5"
                  style={{ background: '#F4F1EA', border: '1px solid #E7E2D8' }}
                >
                  {themeOptions.map(option => {
                    const Icon = option.icon
                    const selected = theme === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setTheme(option.value)}
                        className="pressable flex items-center justify-center gap-1.5 rounded-[1rem] px-2 py-2 text-xs font-semibold"
                        style={selected
                          ? { background: '#FFFFFF', color: '#4F6F52', boxShadow: '0 1px 4px rgba(31,41,55,0.08)' }
                          : { background: 'transparent', color: '#9CA3AF' }
                        }
                        aria-pressed={selected}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* Actions */}
              <section className="mb-6">
                <p
                  className="mb-3 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: '#9CA3AF' }}
                >
                  Data
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="pressable flex items-center gap-3 rounded-[1.2rem] p-4 transition-colors disabled:opacity-60"
                    style={{ background: '#F4F1EA', border: '1px solid #E7E2D8' }}
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: 'rgba(79,111,82,0.12)', border: '1px solid rgba(79,111,82,0.20)' }}
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                        style={{ color: '#4F6F52' }}
                      />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium" style={{ color: '#202124' }}>Refresh Times</p>
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>Fetch latest prayer times</p>
                    </div>
                  </button>

                  <div
                    className="flex items-center gap-3 rounded-[1.2rem] p-4 opacity-50"
                    style={{ background: '#F4F1EA', border: '1px solid #E7E2D8' }}
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: 'rgba(200,169,81,0.12)', border: '1px solid rgba(200,169,81,0.20)' }}
                    >
                      <Bell className="w-4 h-4" style={{ color: '#C8A951' }} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium" style={{ color: '#202124' }}>Notifications</p>
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>Coming soon — iqama reminders</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Masjid selection */}
              <section className="mb-8">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>
                    Favorite Masjids
                  </p>
                  {!allSelected && (
                    <button
                      onClick={() => settings.selectedMasjidIds.forEach(id => toggleMasjid(id))}
                      className="text-xs font-medium"
                      style={{ color: '#4F6F52' }}
                    >
                      Show All
                    </button>
                  )}
                </div>

                <p className="mb-3 text-xs" style={{ color: '#9CA3AF' }}>
                  {allSelected
                    ? 'Showing all masjids. Tap to filter.'
                    : `${settings.selectedMasjidIds.length} selected`
                  }
                </p>

                <div className="flex flex-col gap-2">
                  {masjids.map(masjid => {
                    const selected = allSelected || settings.selectedMasjidIds.includes(masjid.id)
                    return (
                      <button
                        key={masjid.id}
                        onClick={() => toggleMasjid(masjid.id)}
                        className="pressable flex min-h-[70px] items-center justify-between rounded-[1.2rem] p-4 transition-colors"
                        style={{ background: '#F4F1EA', border: '1px solid #E7E2D8' }}
                      >
                        <div className="min-w-0 pr-3 text-left">
                          <p className="truncate text-sm font-medium" style={{ color: '#202124' }}>
                            {masjid.name}
                          </p>
                          <p className="text-xs" style={{ color: '#6B7280' }}>{masjid.city}</p>
                        </div>
                        {selected
                          ? <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: '#4F6F52' }} />
                          : <Circle className="w-5 h-5 shrink-0" style={{ color: '#9CA3AF' }} />
                        }
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* App info */}
              <div className="pb-6 text-center">
                <p className="text-xs" style={{ color: '#9CA3AF' }}>
                  IqamaTime · Updated daily at 11:15 PM CT
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
