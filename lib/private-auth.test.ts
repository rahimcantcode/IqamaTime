import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  createPrivateProfile, loginPrivateProfile, getPrivateSession, clearPrivateSession,
  getPrivatePrayerCheckins, savePrivatePrayerCheckin, removePrivatePrayerSlot,
  getPrivateUserSettings, savePrivateUserSettings, isCurrentPrivateSession,
  subscribeToPrivateAuth,
} from './private-auth'
import { getPrayerCheckins } from './prayer-checkins'

// Network is replaced in its entirety. These are invented identities on an
// invalid test origin; no production account or remote user data is accessed.
test('private auth and persistence RPC contract with a mocked transport', async t => {
  const originalFetch = globalThis.fetch
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const storage = new Map<string, string>()
  const browser = new EventTarget()
  const local: Storage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => { storage.set(key, value) },
    removeItem: key => { storage.delete(key) },
    clear: () => storage.clear(),
    key: index => [...storage.keys()][index] ?? null,
    get length() { return storage.size },
  }
  Object.defineProperty(globalThis, 'window', { value: browser, configurable: true })
  Object.defineProperty(globalThis, 'localStorage', { value: local, configurable: true })
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://private-progress-test.invalid'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-only-anon-key'
  const calls: { name: string; args: Record<string, unknown> }[] = []
  let reply: (name: string, args: Record<string, unknown>) => { body: unknown; status?: number } = () => ({ body: null })
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input))
    assert.equal(url.origin, 'https://private-progress-test.invalid', 'unexpected network target')
    assert.ok(url.pathname.startsWith('/rest/v1/rpc/'), 'only mocked RPC calls are allowed')
    const name = url.pathname.split('/').at(-1)!
    const args = JSON.parse(String(init?.body)) as Record<string, unknown>
    calls.push({ name, args })
    const response = reply(name, args)
    return new Response(JSON.stringify(response.body), { status: response.status ?? 200, headers: { 'Content-Type': 'application/json' } })
  }
  const session = { userId: 'fixture-user-1', username: 'fixture_user', sessionToken: 'fixture-token-1' }
  try {
    await t.test('guest and corrupted sessions are rejected without network calls', () => {
      assert.equal(getPrivateSession(), null)
      for (const value of ['null', '[]', '{}', '{"userId":5,"username":"x","sessionToken":"y"}', 'invalid']) {
        local.setItem('iqamatime:private-session', value)
        assert.equal(getPrivateSession(), null)
      }
      for (const value of ['{}', 'null', '[null, 2, "bad"]', 'invalid']) {
        local.setItem('iqamatime_checkins', value)
        assert.deepEqual(getPrayerCheckins(), [])
      }
      assert.equal(calls.length, 0)
    })

    await t.test('profile creation normalizes username, hashes PIN, and stores returned session', async () => {
      reply = () => ({ body: [{ out_user_id: session.userId, out_username: session.username, out_session_token: session.sessionToken }] })
      let events = 0
      const unsubscribe = subscribeToPrivateAuth(() => { events++ })
      const result = await createPrivateProfile(' Fixture_User ', '1234')
      unsubscribe()
      assert.deepEqual(result, session)
      assert.deepEqual(getPrivateSession(), session)
      assert.equal(events, 1)
      const call = calls.at(-1)!
      assert.equal(call.name, 'create_app_user')
      assert.equal(call.args.p_username, 'fixture_user')
      assert.match(String(call.args.p_pin_hash), /^[0-9a-f]{64}$/)
      assert.ok(!JSON.stringify(call.args).includes('1234'))
      assert.equal(isCurrentPrivateSession(session), true)
    })

    await t.test('read/save/delete use exact current session and preserve returned rows', async () => {
      reply = name => ({ body: name === 'get_private_prayer_checkins' ? [{
        id: 'fixture-checkin', prayer_date: '2026-10-30', prayer: 'jummah', prayer_label: 'Jumuah',
        adhan_time: null, created_at: 'fixture-created', updated_at: 'fixture-updated',
      }] : true })
      const checkins = await getPrivatePrayerCheckins('2026-10-26', '2026-11-01', session)
      assert.deepEqual(checkins[0], { id: 'fixture-checkin', date: '2026-10-30', prayer: 'jummah', prayerLabel: 'Jumuah', adhanTime: '', createdAt: 'fixture-created', updatedAt: 'fixture-updated' })
      await savePrivatePrayerCheckin({ date: '2026-10-30', prayer: 'fajr', prayerLabel: 'Fajr', adhanTime: '6:30 AM' }, session)
      assert.equal(calls.at(-1)!.name, 'save_private_prayer_checkin_v3')
      await removePrivatePrayerSlot('2026-10-30', 'dhuhr', session)
      assert.deepEqual(calls.slice(-2).map(call => call.args.p_prayer), ['dhuhr', 'jummah'])
      for (const call of calls.slice(-4)) {
        assert.equal(call.args.p_user_id, session.userId)
        assert.equal(call.args.p_session_token, session.sessionToken)
      }
    })

    await t.test('settings read and write validate array payloads', async () => {
      reply = () => ({ body: [{ selected_masjid_ids: ['fixture-masjid', null, 7] }] })
      assert.deepEqual(await getPrivateUserSettings(session), ['fixture-masjid'])
      assert.deepEqual(await savePrivateUserSettings([], session), ['fixture-masjid'])
      assert.deepEqual(calls.at(-1)!.args.p_selected_masjid_ids, [])
    })

    await t.test('RPC errors propagate instead of reporting successful persistence', async () => {
      reply = () => ({ status: 400, body: { code: 'P0001', message: 'Not authenticated.' } })
      const before = calls.length
      await assert.rejects(savePrivatePrayerCheckin({ date: '2026-10-30', prayer: 'fajr', prayerLabel: 'Fajr', adhanTime: '' }, session), /Not authenticated/)
      assert.equal(calls.length, before + 1)
      await assert.rejects(getPrivatePrayerCheckins(undefined, undefined, session), /Not authenticated/)
    })

    await t.test('canceled login never overwrites an existing profile with a late response', async () => {
      const controller = new AbortController()
      reply = () => {
        controller.abort()
        return { body: [{ user_id: 'other-user', username: 'other', session_token: 'other-token' }] }
      }
      await assert.rejects(loginPrivateProfile('other', '1234', controller.signal))
      assert.deepEqual(getPrivateSession(), session)
    })

    await t.test('session identity guards reject old responses after account switch or logout', () => {
      local.setItem('iqamatime:private-session', JSON.stringify({ userId: 'other', username: 'other', sessionToken: 'other-token' }))
      assert.equal(isCurrentPrivateSession(session), false)
      clearPrivateSession()
      assert.equal(getPrivateSession(), null)
      assert.equal(isCurrentPrivateSession(session), false)
    })
  } finally {
    globalThis.fetch = originalFetch
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow)
    else Reflect.deleteProperty(globalThis, 'window')
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage)
    else Reflect.deleteProperty(globalThis, 'localStorage')
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
    if (originalKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey
  }
})
