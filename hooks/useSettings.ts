'use client'

import { useState, useEffect, useCallback } from 'react'
import { AppSettings } from '@/types'

const STORAGE_KEY = 'iqamatime:settings'

const DEFAULT_SETTINGS: AppSettings = {
  selectedMasjidIds: [], // empty = show all
  theme: 'dark',
}

export function useSettings() {
  const readSettings = useCallback((): AppSettings => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
      }
    } catch {}
    return DEFAULT_SETTINGS
  }, [])

  const [settings, setSettings] = useState<AppSettings>(readSettings)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setLoaded(true))
    return () => window.cancelAnimationFrame(id)
  }, [])

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const toggleMasjid = useCallback((masjidId: string) => {
    setSettings(prev => {
      const ids = prev.selectedMasjidIds
      const next = ids.includes(masjidId)
        ? ids.filter(id => id !== masjidId)
        : [...ids, masjidId]
      const updated = { ...prev, selectedMasjidIds: next }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch {}
      return updated
    })
  }, [])

  return { settings, updateSettings, toggleMasjid, loaded }
}
