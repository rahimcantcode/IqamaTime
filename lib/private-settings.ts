import type { AppSettings } from '../types'

export const DEFAULT_SETTINGS: AppSettings = { selectedMasjidIds: [], theme: 'dark' }

export function settingsStorageKey(userId?: string): string {
  return userId ? `iqamatime:settings:${userId}` : 'iqamatime:settings'
}

export function parseStoredSettings(raw: string | null, isPrivate: boolean): AppSettings {
  try {
    const value: unknown = raw ? JSON.parse(raw) : null
    if (!value || typeof value !== 'object') return { ...DEFAULT_SETTINGS }
    const settings = value as Record<string, unknown>
    return {
      theme: settings.theme === 'light' ? 'light' : 'dark',
      // Old shared-device caches may contain another profile's favorites. Only
      // use favorites from the new, profile-scoped cache, never the guest key.
      selectedMasjidIds: isPrivate && Array.isArray(settings.selectedMasjidIds)
        ? settings.selectedMasjidIds.filter((id): id is string => typeof id === 'string')
        : [],
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

/** Per-profile revision fence shared by every hook mounted in this tab. */
export function createSettingsRevisionTracker() {
  const revisions = new Map<string, number>()
  return {
    read(owner: string): number { return revisions.get(owner) ?? 0 },
    invalidate(owner: string): number {
      const next = (revisions.get(owner) ?? 0) + 1
      revisions.set(owner, next)
      return next
    },
    isCurrent(owner: string, revision: number): boolean { return (revisions.get(owner) ?? 0) === revision },
  }
}

// Only accessed from client effects/events. No profile data is kept here.
export const settingsRevisions = createSettingsRevisionTracker()
