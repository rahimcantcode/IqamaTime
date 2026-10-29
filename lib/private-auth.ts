'use client'

import { createClient } from '@/lib/supabase'
import { PrayerCheckin } from '@/lib/prayer-checkins'
import { savePrivateCheckinRpc } from '@/lib/private-rpc'
import { prayerKeysForSlot } from '@/lib/progress'

const SESSION_KEY = 'iqamatime:private-session'
const AUTH_EVENT = 'iqamatime-auth-changed'

export interface PrivateUserSession {
  userId: string
  username: string
  sessionToken: string
}

export type PrivatePrayerCheckin = PrayerCheckin

function normalizeUsername(username: string) {
  return username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
}

function readAuthRow(input: unknown): PrivateUserSession {
  if (!input || typeof input !== 'object') throw new Error('Profile login returned no session.')
  const row = input as Record<string, unknown>
  const userId = row.user_id ?? row.out_user_id
  const username = row.username ?? row.out_username
  const sessionToken = row.session_token ?? row.out_session_token
  if (typeof userId !== 'string' || typeof username !== 'string' || typeof sessionToken !== 'string') {
    throw new Error('Profile login returned an invalid session.')
  }
  return { userId, username, sessionToken }
}

async function sha256(value: string) {
  const encoder = new TextEncoder()
  const data = encoder.encode(value)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

export async function hashPrivatePin(username: string, pin: string) {
  return sha256(`${normalizeUsername(username)}:${pin}`)
}

export function getPrivateSession(): PrivateUserSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PrivateUserSession
    if (!parsed || typeof parsed !== 'object' ||
      ![parsed.userId, parsed.username, parsed.sessionToken].every(value => typeof value === 'string' && value.length > 0)) return null
    return parsed
  } catch {
    return null
  }
}

function setPrivateSession(session: PrivateUserSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  window.dispatchEvent(new Event(AUTH_EVENT))
}

export function clearPrivateSession() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SESSION_KEY)
  window.dispatchEvent(new Event(AUTH_EVENT))
}

export function subscribeToPrivateAuth(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === SESSION_KEY || event.key === null) callback()
  }
  window.addEventListener(AUTH_EVENT, callback)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(AUTH_EVENT, callback)
    window.removeEventListener('storage', onStorage)
  }
}

export async function createPrivateProfile(username: string, pin: string, signal?: AbortSignal) {
  const cleanUsername = normalizeUsername(username)

  if (cleanUsername.length < 3 || cleanUsername.length > 24) {
    throw new Error('Username must be 3 to 24 characters.')
  }

  if (!/^\d{4,6}$/.test(pin)) {
    throw new Error('PIN must be 4 to 6 digits.')
  }

  const supabase = createClient()
  const pinHash = await hashPrivatePin(cleanUsername, pin)
  signal?.throwIfAborted()
  const request = supabase.rpc('create_app_user', {
    p_username: cleanUsername,
    p_pin_hash: pinHash,
  })
  const { data, error } = await (signal ? request.abortSignal(signal) : request)

  if (error) throw new Error(error.message)

  const row = Array.isArray(data) ? data[0] : data
  const session = readAuthRow(row)

  signal?.throwIfAborted()
  setPrivateSession(session)
  return session
}

export async function loginPrivateProfile(username: string, pin: string, signal?: AbortSignal) {
  const cleanUsername = normalizeUsername(username)

  if (!cleanUsername || !pin) {
    throw new Error('Username and PIN are required.')
  }

  const supabase = createClient()
  const pinHash = await hashPrivatePin(cleanUsername, pin)
  signal?.throwIfAborted()
  const request = supabase.rpc('login_app_user', {
    p_username: cleanUsername,
    p_pin_hash: pinHash,
  })
  const { data, error } = await (signal ? request.abortSignal(signal) : request)

  if (error) throw new Error(error.message)

  const row = Array.isArray(data) ? data[0] : data
  const session = readAuthRow(row)

  signal?.throwIfAborted()
  setPrivateSession(session)
  return session
}

export async function getPrivateUserSettings(session = getPrivateSession()) {
  if (!session) throw new Error('Not logged in.')
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_private_user_settings', {
    p_user_id: session.userId,
    p_session_token: session.sessionToken,
  })
  if (error) throw new Error(error.message)
  const row = Array.isArray(data) ? data[0] : data
  return Array.isArray(row?.selected_masjid_ids)
    ? row.selected_masjid_ids.filter((id: unknown): id is string => typeof id === 'string') : []
}

export async function savePrivateUserSettings(selectedMasjidIds: string[], session = getPrivateSession()) {
  if (!session) throw new Error('Not logged in.')
  const supabase = createClient()
  const { data, error } = await supabase.rpc('save_private_user_settings', {
    p_user_id: session.userId,
    p_session_token: session.sessionToken,
    p_selected_masjid_ids: selectedMasjidIds,
  })
  if (error) throw new Error(error.message)
  const row = Array.isArray(data) ? data[0] : data
  return Array.isArray(row?.selected_masjid_ids)
    ? row.selected_masjid_ids.filter((id: unknown): id is string => typeof id === 'string') : []
}

export async function getPrivatePrayerCheckins(startDate?: string, endDate?: string, session = getPrivateSession()) {
  if (!session) throw new Error('Not logged in.')
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_private_prayer_checkins', {
    p_user_id: session.userId,
    p_session_token: session.sessionToken,
    p_start_date: startDate ?? null,
    p_end_date: endDate ?? null,
  })
  if (error) throw new Error(error.message)

  return (data ?? []).map((row: { id: string; prayer_date: string; prayer: PrayerCheckin['prayer']; prayer_label: string; adhan_time?: string; created_at: string; updated_at: string }) => ({
    id: row.id,
    date: row.prayer_date,
    prayer: row.prayer,
    prayerLabel: row.prayer_label,
    adhanTime: row.adhan_time ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })) as PrivatePrayerCheckin[]
}

export async function savePrivatePrayerCheckin(
  data: Omit<PrayerCheckin, 'id' | 'createdAt' | 'updatedAt'>,
  session = getPrivateSession()
) {
  if (!session) throw new Error('Not logged in.')
  const supabase = createClient()
  const payload = {
    p_user_id: session.userId,
    p_session_token: session.sessionToken,
    p_prayer_date: data.date,
    p_prayer: data.prayer,
    p_prayer_label: data.prayerLabel,
    p_adhan_time: data.adhanTime ?? '',
  }

  await savePrivateCheckinRpc((name, args) => supabase.rpc(name, args), payload)
}

export async function removePrivatePrayerCheckin(date: string, prayer: string, session = getPrivateSession()) {
  if (!session) throw new Error('Not logged in.')
  const supabase = createClient()
  const { error } = await supabase.rpc('delete_private_prayer_checkin', {
    p_user_id: session.userId,
    p_session_token: session.sessionToken,
    p_prayer_date: date,
    p_prayer: prayer,
  })
  if (error) throw new Error(error.message)
}

/** Remove both persisted aliases for the Friday noon prayer, including legacy rows. */
export async function removePrivatePrayerSlot(date: string, prayer: string, session = getPrivateSession()) {
  for (const key of prayerKeysForSlot(date, prayer)) {
    await removePrivatePrayerCheckin(date, key, session)
  }
}

export function isCurrentPrivateSession(session: PrivateUserSession): boolean {
  const current = getPrivateSession()
  return current?.userId === session.userId && current?.sessionToken === session.sessionToken
}
