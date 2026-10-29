import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { getLocalDate, type PrayerCheckin } from './prayer-checkins'
import { buildWeekLog, getProgressWeek, prayerKeysForSlot } from './progress'
import { isMissingFunction, savePrivateCheckinRpc, type PrivateRpcError } from './private-rpc'
import { parseStoredSettings, settingsStorageKey, createSettingsRevisionTracker } from './private-settings'

const makeCheckin = (date: string, prayer: string, label = prayer): PrayerCheckin => ({
  id: `${date}:${prayer}`, date, prayer, prayerLabel: label, adhanTime: '', createdAt: '', updatedAt: '',
})

test('check-in date follows Dallas even when the device UTC date has advanced', () => {
  assert.equal(getLocalDate(new Date('2026-10-30T02:30:00Z')), '2026-10-29')
  assert.equal(getLocalDate(new Date('2026-11-02T05:30:00Z')), '2026-11-01')
})

test('progress weeks use Monday through Sunday without device-timezone or DST drift', () => {
  assert.deepEqual(getProgressWeek('2026-11-01').map(day => day.dateKey),
    ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01'])
  assert.equal(getProgressWeek('2026-01-01')[0].dateKey, '2025-12-29')
  assert.equal(getProgressWeek('2026-03-09')[0].dateKey, '2026-03-09')
})

test('Friday Jumuah and Dhuhr share one slot without double-counting or trusting labels', () => {
  const week = getProgressWeek('2026-10-30')
  const result = buildWeekLog(week, [makeCheckin('2026-10-30', 'jummah', 'Jumu\u2019ah'), makeCheckin('2026-10-30', 'dhuhr'), makeCheckin('2026-10-30', 'fajr', 'untrusted label')])
  assert.equal(result['2026-10-30'].Dhuhr, true)
  assert.equal(result['2026-10-30'].Fajr, true)
  assert.equal(Object.values(result['2026-10-30']).filter(Boolean).length, 2)
  assert.deepEqual(prayerKeysForSlot('2026-10-30', 'dhuhr'), ['dhuhr', 'jummah'])
  assert.deepEqual(prayerKeysForSlot('2026-10-30', 'jummah'), ['dhuhr', 'jummah'])
  assert.deepEqual(prayerKeysForSlot('2026-10-29', 'dhuhr'), ['dhuhr'])
  assert.equal(buildWeekLog(week, [makeCheckin('2026-10-29', 'jummah')])['2026-10-29'].Dhuhr, false)
})

test('empty, duplicate, out-of-week and unrecognized check-ins do not fabricate progress', () => {
  const week = getProgressWeek('2026-10-29')
  const result = buildWeekLog(week, [makeCheckin('2026-10-29', 'asr'), makeCheckin('2026-10-29', 'asr'), makeCheckin('2026-10-20', 'isha'), makeCheckin('2026-10-29', 'other')])
  assert.equal(Object.values(result).flatMap(Object.values).filter(Boolean).length, 1)
  assert.equal(Object.values(buildWeekLog(week)).flatMap(Object.values).filter(Boolean).length, 0)
})

test('RPC fallback recognizes PostgREST schema-cache misses and PostgreSQL undefined functions', () => {
  assert.equal(isMissingFunction({ code: 'PGRST202', message: 'Could not find the function in the schema cache' }), true)
  assert.equal(isMissingFunction({ code: '42883', message: 'undefined function' }), true)
  assert.equal(isMissingFunction({ message: 'function example does not exist' }), true)
  assert.equal(isMissingFunction({ code: '42501', message: 'permission denied for function example' }), false)
  assert.equal(isMissingFunction({ message: 'Failed to fetch' }), false)
})

test('save RPC succeeds once, falls back only for missing functions, and preserves payload', async () => {
  const payload = { p_user_id: 'fixture-user', p_session_token: 'fixture-token', p_prayer: 'fajr' }
  const calls: string[] = []
  await savePrivateCheckinRpc(async (name, args) => {
    calls.push(name)
    assert.equal(args, payload)
    return { error: name.endsWith('_v3') ? { code: 'PGRST202', message: 'not cached' } : null }
  }, payload)
  assert.deepEqual(calls, ['save_private_prayer_checkin_v3', 'save_private_prayer_checkin_v2'])
  calls.length = 0
  await savePrivateCheckinRpc(async name => { calls.push(name); return { error: null } }, payload)
  assert.deepEqual(calls, ['save_private_prayer_checkin_v3'])
})

test('save RPC never retries an auth, network or executed SQL failure', async () => {
  for (const error of [
    { code: 'P0001', message: 'Not authenticated.' },
    { code: '42501', message: 'permission denied for function' },
    { code: '', message: 'Failed to fetch' },
    { code: '42702', message: 'column reference is ambiguous' },
  ] satisfies PrivateRpcError[]) {
    let calls = 0
    await assert.rejects(savePrivateCheckinRpc(async () => { calls++; return { error } }, {}), { message: error.message })
    assert.equal(calls, 1)
  }
})

test('legacy missing-function chain is bounded and returns the actual last error', async () => {
  const calls: string[] = []
  await assert.rejects(savePrivateCheckinRpc(async name => {
    calls.push(name)
    return { error: { code: 'PGRST202', message: `${name} unavailable` } }
  }, {}), /upsert_private_prayer_checkin unavailable/)
  assert.deepEqual(calls, ['save_private_prayer_checkin_v3', 'save_private_prayer_checkin_v2', 'upsert_private_prayer_checkin'])
})

test('settings caches are profile-scoped and guest cache cannot reveal former profile favorites', () => {
  assert.notEqual(settingsStorageKey('alice'), settingsStorageKey('bob'))
  const raw = JSON.stringify({ theme: 'light', selectedMasjidIds: ['one', 7, null] })
  assert.deepEqual(parseStoredSettings(raw, true), { theme: 'light', selectedMasjidIds: ['one'] })
  assert.deepEqual(parseStoredSettings(raw, false), { theme: 'light', selectedMasjidIds: [] })
  for (const malformed of ['null', '[]', 'invalid', '{"selectedMasjidIds":"oops"}']) {
    assert.deepEqual(parseStoredSettings(malformed, true).selectedMasjidIds, [])
  }
})

test('safety migration revokes internal session minting and keeps session validation before writes', () => {
  const sql = readFileSync('supabase/migrations/006_private_progress_safety.sql', 'utf8')
  assert.match(sql, /revoke all on function public\.create_private_session\(uuid\) from public, anon, authenticated;/)
  assert.match(sql, /revoke all on function public\.validate_private_session\(uuid, text\) from public, anon, authenticated;/)
  assert.match(sql, /if not public\.validate_private_session\(p_user_id, p_session_token\) then/)
  assert.match(sql, /returns boolean[\s\S]*on conflict \(user_id, prayer_date, prayer\)/)
  assert.match(sql, /perform public\.save_private_prayer_checkin_v3\(/)
  assert.doesNotMatch(sql, /delete from|truncate |drop table/i)
})

test('feed permission migration restricts every historical service write policy without removing public reads', () => {
  const sql = readFileSync('supabase/migrations/007_public_feed_write_permissions.sql', 'utf8')
  const original = ['001_initial_schema.sql', '002_community_events.sql', '004_masjids_unique_name.sql']
    .map(file => readFileSync(`supabase/migrations/${file}`, 'utf8')).join('\n')
  const policies = [...original.matchAll(/create policy "(service [^"]+)"\s+on\s+(\w+)\s+for\s+(?:insert|update)/g)]
  assert.equal(policies.length, 7)
  for (const [, name, table] of policies) {
    assert.ok(sql.includes(`alter policy "${name}" on public.${table} to service_role;`))
  }
  assert.match(sql, /revoke insert, update, delete, truncate on table public\.masjids, public\.prayer_times, public\.community_events from public, anon, authenticated;/)
  assert.doesNotMatch(sql, /revoke select|drop policy|delete from|truncate table/i)
})


test('shared settings revisions reject another hook’s stale initial read after a save', async () => {
  const versions = createSettingsRevisionTracker()
  const owner = settingsStorageKey('fixture-profile')
  const otherOwner = settingsStorageKey('other-profile')
  let cache = ['initial']
  let dashboardLoaded = false
  const dashboardReadRevision = versions.read(owner)
  const sheetReadRevision = versions.read(owner)
  // SettingsSheet completes its initial fetch and publishes a shared cache.
  assert.equal(versions.isCurrent(owner, sheetReadRevision), true)
  versions.invalidate(owner)
  cache = ['initial']
  // The user saves a different selection in SettingsSheet while Dashboard's
  // initial read is still in flight. Both start and publish fence older reads.
  versions.invalidate(owner)
  cache = ['saved-favorite']
  versions.invalidate(owner)
  try {
    if (versions.isCurrent(owner, dashboardReadRevision)) cache = ['stale-response']
  } finally {
    dashboardLoaded = true
  }
  assert.deepEqual(cache, ['saved-favorite'])
  assert.equal(dashboardLoaded, true, 'rejected reads must still finish loading')
  assert.equal(versions.isCurrent(otherOwner, 0), true, 'profiles have independent revisions')
})

test('a load can publish its own cache update and still complete, and cross-tab invalidation fences stale reads', () => {
  const versions = createSettingsRevisionTracker()
  const owner = settingsStorageKey('fixture-profile')
  const ownReadRevision = versions.read(owner)
  let loaded = false
  try {
    assert.equal(versions.isCurrent(owner, ownReadRevision), true)
    versions.invalidate(owner) // own cache publication/event
  } finally {
    loaded = true // loading completion is local-request based, not revision based
  }
  assert.equal(loaded, true)
  const pendingReadRevision = versions.read(owner)
  versions.invalidate(owner) // another tab's storage event
  assert.equal(versions.isCurrent(owner, pendingReadRevision), false)
})
