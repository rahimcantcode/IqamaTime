'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AppSettings } from '@/types'
import { DEFAULT_SETTINGS, settingsStorageKey, parseStoredSettings, settingsRevisions } from '@/lib/private-settings'
import {
  getPrivateSession,
  getPrivateUserSettings,
  savePrivateUserSettings,
  subscribeToPrivateAuth,
  isCurrentPrivateSession,
} from '@/lib/private-auth'

const SETTINGS_EVENT = 'iqamatime-settings-changed'

function readLocalSettings(userId?: string): AppSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS }
  try {
    return parseStoredSettings(localStorage.getItem(settingsStorageKey(userId)), !!userId)
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

function cacheSettings(next: AppSettings, userId?: string) {
  settingsRevisions.invalidate(settingsStorageKey(userId))
  localStorage.setItem(settingsStorageKey(userId), JSON.stringify(next))
  window.dispatchEvent(new Event(SETTINGS_EVENT))
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const settingsRef = useRef(settings)
  const settingsOwner = useRef<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const [syncError, setSyncError] = useState('')
  const [requiresLogin, setRequiresLogin] = useState(false)
  const loadSequence = useRef(0)
  const invalidateLoads = useCallback(() => { ++loadSequence.current }, [])

  const showSettings = useCallback((next: AppSettings) => {
    settingsRef.current = next
    setSettings(next)
  }, [])

  const syncPrivateSettings = useCallback(async () => {
    const request = ++loadSequence.current
    const session = getPrivateSession()
    const owner = settingsStorageKey(session?.userId)
    const revision = settingsRevisions.read(owner)
    settingsOwner.current = session?.sessionToken ?? null
    showSettings(readLocalSettings(session?.userId))
    setSyncError('')
    if (!session) {
      setLoaded(true)
      return
    }
    setLoaded(false)
    try {
      const selectedMasjidIds = await getPrivateUserSettings(session)
      if (request !== loadSequence.current || !isCurrentPrivateSession(session) || !settingsRevisions.isCurrent(owner, revision)) return
      const next = { ...readLocalSettings(session.userId), selectedMasjidIds }
      showSettings(next)
      try { cacheSettings(next, session.userId) } catch { /* Remote data remains authoritative. */ }
    } catch {
      if (request === loadSequence.current && isCurrentPrivateSession(session) && settingsRevisions.isCurrent(owner, revision)) {
        setSyncError('Could not load saved preferences. Showing this profile’s cached settings. Retry when connected.')
      }
    } finally {
      if (request === loadSequence.current) setLoaded(true)
    }
  }, [showSettings])

  useEffect(() => {
    const timer = window.setTimeout(() => void syncPrivateSettings(), 0)
    const unsubscribe = subscribeToPrivateAuth(() => void syncPrivateSettings())
    const readCache = () => showSettings(readLocalSettings(getPrivateSession()?.userId))
    const onStorage = (event: StorageEvent) => {
      const owner = settingsStorageKey(getPrivateSession()?.userId)
      if (event.key === owner || event.key === null) {
        settingsRevisions.invalidate(owner)
        readCache()
      }
    }
    window.addEventListener(SETTINGS_EVENT, readCache)
    window.addEventListener('storage', onStorage)
    return () => {
      invalidateLoads()
      window.clearTimeout(timer)
      unsubscribe()
      window.removeEventListener(SETTINGS_EVENT, readCache)
      window.removeEventListener('storage', onStorage)
    }
  }, [syncPrivateSettings, showSettings, invalidateLoads])

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    const session = getPrivateSession()
    if (!session && updates.selectedMasjidIds !== undefined) {
      setRequiresLogin(true)
      return
    }
    if ((session?.sessionToken ?? null) !== settingsOwner.current || !loaded || savingRef.current) return
    const before = settingsRef.current
    const next = { ...before, ...updates }
    savingRef.current = true
    // Invalidate pending reads in *all* mounted settings hooks, not just this
    // instance. Otherwise another initial RPC can overwrite a completed save.
    settingsRevisions.invalidate(settingsStorageKey(session?.userId))
    setSaving(true)
    ++loadSequence.current
    showSettings(next)
    setSyncError('')
    try {
      if (session) await savePrivateUserSettings(next.selectedMasjidIds, session)
      if (session && !isCurrentPrivateSession(session)) return
      try { cacheSettings(next, session?.userId) } catch {
        if (!session) throw new Error('Local storage unavailable')
      }
    } catch {
      if (!session || isCurrentPrivateSession(session)) {
        showSettings(before)
        setSyncError('Could not confirm your preferences were saved. Reload to verify, or log in again if your session expired.')
      }
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }, [loaded, showSettings])

  const toggleMasjid = useCallback((masjidId: string) => {
    const ids = settingsRef.current.selectedMasjidIds
    void updateSettings({ selectedMasjidIds: ids.includes(masjidId) ? ids.filter(id => id !== masjidId) : [...ids, masjidId] })
  }, [updateSettings])

  const clearLoginRequirement = useCallback(() => setRequiresLogin(false), [])

  return { settings, updateSettings, toggleMasjid, loaded, saving, syncError, requiresLogin, clearLoginRequirement, syncPrivateSettings }
}
