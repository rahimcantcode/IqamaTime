'use client'

import { useState } from 'react'
import { RefreshCw, Bell, CheckCircle2, Circle, Settings } from 'lucide-react'
import { Masjid } from '@/types'
import { useSettings } from '@/hooks/useSettings'
import BottomNav from '@/components/bottom-nav'

interface Props {
  masjids: Masjid[]
}

export default function SettingsPageClient({ masjids }: Props) {
  const { settings, toggleMasjid } = useSettings()
  const [refreshing, setRefreshing] = useState(false)

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
    <main
      className="min-h-screen bg-[#FAFAF7] scrollbar-none"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
    >
      <div className="px-6 pb-2 pt-2">
        <div className="mb-1 flex items-center gap-2">
          <Settings className="w-5 h-5" style={{ color: '#4F6F52' }} />
          <h1 className="text-xl font-bold" style={{ color: '#202124' }}>Settings</h1>
        </div>
        <p className="text-xs" style={{ color: '#6B7280' }}>Customize your experience</p>
      </div>

      <div className="px-6 pb-32 pt-4">
        <section className="mb-6">
          <p
            className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.18em]"
            style={{ color: '#9CA3AF' }}
          >
            Data
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="pressable flex items-center gap-3 rounded-[1.2rem] p-4 transition-colors disabled:opacity-60"
              style={{ background: '#FFFFFF', border: '1px solid #E7E2D8', boxShadow: '0 1px 4px rgba(31,41,55,0.05)' }}
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
              style={{ background: '#FFFFFF', border: '1px solid #E7E2D8' }}
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

        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em]" style={{ color: '#9CA3AF' }}>
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
                  style={{ background: '#FFFFFF', border: '1px solid #E7E2D8', boxShadow: '0 1px 4px rgba(31,41,55,0.05)' }}
                >
                  <div className="min-w-0 pr-3 text-left">
                    <p className="truncate text-sm font-medium" style={{ color: '#202124' }}>{masjid.name}</p>
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

        <div className="text-center">
          <p className="text-xs" style={{ color: '#9CA3AF' }}>IqamaTime · Updated daily at 11:15 PM CT</p>
        </div>
      </div>

      <BottomNav />
    </main>
  )
}
