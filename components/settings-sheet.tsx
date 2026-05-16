'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, RefreshCw, Bell, CheckCircle2, Circle } from 'lucide-react'
import { Masjid } from '@/types'
import { useSettings } from '@/hooks/useSettings'
import { useState } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  masjids: Masjid[]
  onRefresh: () => void
}

export default function SettingsSheet({ open, onClose, masjids, onRefresh }: Props) {
  const { settings, toggleMasjid } = useSettings()
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
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 36 }}
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-3xl overflow-hidden"
            style={{ maxHeight: '82vh', background: '#0f0f1a' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4">
              <h2 className="text-xl font-bold text-white">Settings</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 active:bg-white/10"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 pb-safe">

              {/* Actions */}
              <section className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-3">
                  Data
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.04] active:bg-white/[0.08] transition-colors"
                  >
                    <RefreshCw
                      className={`w-5 h-5 text-emerald-400 ${refreshing ? 'animate-spin' : ''}`}
                    />
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">Refresh Times</p>
                      <p className="text-xs text-white/40">Fetch latest prayer times</p>
                    </div>
                  </button>

                  <button
                    className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.04] opacity-50 cursor-not-allowed"
                    disabled
                  >
                    <Bell className="w-5 h-5 text-amber-400" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">Notifications</p>
                      <p className="text-xs text-white/40">Coming soon — iqama reminders</p>
                    </div>
                  </button>
                </div>
              </section>

              {/* Masjid selection */}
              <section className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/30">
                    Favorite Masjids
                  </p>
                  {!allSelected && (
                    <button
                      onClick={() => {
                        // Clear selection = show all
                        settings.selectedMasjidIds.forEach(id => toggleMasjid(id))
                      }}
                      className="text-xs text-emerald-400 font-medium"
                    >
                      Show All
                    </button>
                  )}
                </div>

                <p className="text-xs text-white/30 mb-3">
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
                        className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.04] active:bg-white/[0.08] transition-colors"
                      >
                        <div className="text-left">
                          <p className="text-sm font-medium text-white">{masjid.name}</p>
                          <p className="text-xs text-white/40">{masjid.city}</p>
                        </div>
                        {selected
                          ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          : <Circle       className="w-5 h-5 text-white/20 shrink-0" />
                        }
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* App info */}
              <div className="text-center pb-6">
                <p className="text-xs text-white/15">IqamaTime · Updated daily at 11:15 PM CT</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
