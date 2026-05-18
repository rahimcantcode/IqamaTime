'use client'

import { useState, useEffect, useCallback } from 'react'
import { AppSettings } from '@/types'
import {
  getPrivateSession,
  getPrivateUserSettings,
  savePrivateUserSettings,
  subscribeToPrivateAuth,
} from '@/lib/private-auth'

const STORAGE_KEY = 'iqamatime:settings'

const DEFAULT_SETTINGS: AppSettings = {
  selectedMasjidIds: [], // empty = show all
  theme: 'dark',
}

export function useSettings() {
  const readLocalSettings = useCallback((): AppSettings => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
      }
    } catch {}
    return DEFAULT_SETTINGS
  }, [])

  const [settings, setSettings] = useState<AppSettings>(readLocalSettings)
  const [loaded, setLoaded] = useState(false)
  const [requiresLogin, setRequiresLogin] = useState(false)

  const persistSettings = useCallback(async (next: AppSettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {}

    const session = getPrivateSession()
    if (session) {
      try {
        await savePrivateUserSettings(next.selectedMasjidIds, session)
      } catch {}
    }
  }, [])

  const syncPrivateSettings = useCallback(async () => {
    const session = getPrivateSession()
    if (!session) {
      setSettings(readLocalSettings())
      setLoaded(true)
      return
    }

    try {
      const selectedMasjidIds = await getPrivateUserSettings(session)
      const next = { ...DEFAULT_SETTINGS, selectedMasjidIds }
      setSettings(next)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      setSettings(readLocalSettings())
    } finally {
      setLoaded(true)
    }
  }, [readLocalSettings])

  useEffect(() => {
    syncPrivateSettings()
    return subscribeToPrivateAuth(syncPrivateSettings)
  }, [syncPrivateSettings])

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    const session = getPrivateSession()
    if (!session && updates.selectedMasjidIds !== undefined) {
      setRequiresLogin(true)
      return
    }

    setSettings(prev => {
      const next = { ...prev, ...updates }
      persistSettings(next)
      return next
    })
  }, [persistSettings])

  const toggleMasjid = useCallback((masjidId: string) => {
    const session = getPrivateSession()
    if (!session) {
      setRequiresLogin(true)
      return
    }

    setSettings(prev => {
      const ids = prev.selectedMasjidIds
      const nextIds = ids.includes(masjidId)
        ? ids.filter(id => id !== masjidId)
        : [...ids, masjidId]
      const next = { ...prev, selectedMasjidIds: nextIds }
      persistSettings(next)
      return next
    })
  }, [persistSettings])

  const clearLoginRequirement = useCallback(() => setRequiresLogin(false), [])

  return {
    settings,
    updateSettings,
    toggleMasjid,
    loaded,
    requiresLogin,
    clearLoginRequirement,
    syncPrivateSettings,
  }
}
