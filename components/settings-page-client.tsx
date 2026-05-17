'use client'

import { useState } from 'react'
import { RefreshCw, Bell, CheckCircle2, Circle, Settings } from 'lucide-react'
import { Masjid } from '@/types'
import { useSettings } from '@/hooks/useSettings'

interface Props {
  masjids: Masjid[]
}

export default function SettingsPageClient({ masjids }: Props) {
  const { settings, toggleMasjid } = useSettings()
  const [refreshing, setRefreshing]  = useState(false)

  const allSelected = settings.selectedMasjidIds.length === 0

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetch('/api/prayers', { cache: 'no-store' })
      window.location.reload()
    } catch {}
    setTimeout(() => setRefreshing(false), 1500)
  }

  return (
    <div
      className="fixed inset-0 flex flex-col bg-[#131925] overflow-y-auto scrollbar-none"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
    >
      {/* Header */}
      <div className="px-6 pt-2 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5" style={{ color: '#1ca094' }} />
          <h1 className="text-xl font-bold text-white">Settings</h1>
        </div>
        <p className="text-xs text-white/30">Customize your experience</p>
      </div>

      <div className="flex-1 px-6 pt-4 pb-32">
        {/* Data section */}
        <section className="mb-6">
          <p className="text-[0.65rem] font-semibold tracking-[0.18em] uppercase text-white/30 mb-3">
            Data
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-3 p-4 rounded-2xl transition-colors active:scale-[0.98]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(28,160,148,0.15)', border: '1px solid rgba(28,160,148,0.25)' }}
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                  style={{ color: '#1ca094' }}
                />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">Refresh Times</p>
                <p className="text-xs text-white/40">Fetch latest prayer times</p>
              </div>
            </button>

            <div
              className="flex items-center gap-3 p-4 rounded-2xl opacity-50"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.25)' }}
              >
                <Bell className="w-4 h-4" style={{ color: '#d4af37' }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">Notifications</p>
                <p className="text-xs text-white/40">Coming soon — iqama reminders</p>
              </div>
            </div>
          </div>
        </section>

        {/* Masjid selection */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[0.65rem] font-semibold tracking-[0.18em] uppercase text-white/30">
              Favorite Masjids
            </p>
            {!allSelected && (
              <button
                onClick={() => settings.selectedMasjidIds.forEach(id => toggleMasjid(id))}
                className="text-xs font-medium"
                style={{ color: '#1ca094' }}
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
                  className="flex items-center justify-between p-4 rounded-2xl transition-colors active:scale-[0.98]"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{masjid.name}</p>
                    <p className="text-xs text-white/40">{masjid.city}</p>
                  </div>
                  {selected
                    ? <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: '#1ca094' }} />
                    : <Circle className="w-5 h-5 text-white/20 shrink-0" />
                  }
                </button>
              )
            })}
          </div>
        </section>

        {/* App info */}
        <div className="text-center">
          <p className="text-xs text-white/15">IqamaTime · Updated daily at 11:15 PM CT</p>
        </div>
      </div>
    </div>
  )
}
