'use client'

import { useState, useEffect, useCallback } from 'react'
import { AppSettings } from '@/types'

const STORAGE_KEY = 'iqamatime:settings'

const DEFAULT_SETTINGS: AppSettings = {
  selectedMasjidIds: [], // empty = show all
  theme: 'dark',
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) })
      }
    } catch {}
    setLoaded(true)
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
