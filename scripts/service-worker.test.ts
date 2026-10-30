import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

function worker() {
  const listeners = new Map<string, (event: unknown) => void>()
  let fetches = 0
  let puts = 0
  runInNewContext(readFileSync('public/sw.js', 'utf8'), {
    self: {
      location: { origin: 'https://iqama-time.vercel.app' },
      addEventListener: (name: string, callback: (event: unknown) => void) => listeners.set(name, callback),
      skipWaiting() {}, clients: { claim() {} },
    },
    URL, Response,
    fetch: async () => { fetches++; return new Response('fresh') },
    caches: {
      match: async () => undefined,
      open: async () => ({ put: async () => { puts++ } }),
    },
  })
  return { listeners, fetches: () => fetches, puts: () => puts }
}

test('service worker never caches RPCs, third-party data, or Next.js dynamic RSC responses', () => {
  for (const request of [
    { url: 'https://database.supabase.co/rest/v1/rpc/get_private_session', method: 'POST' },
    { url: 'https://database.supabase.co/rest/v1/prayer_times', method: 'GET' },
    { url: 'https://iqama-time.vercel.app/?_rsc=abc', method: 'GET' },
    { url: 'https://iqama-time.vercel.app/progress?_rsc=xyz', method: 'GET' },
    { url: 'https://iqama-time.vercel.app/updates?_rsc=xyz', method: 'GET' },
  ]) {
    const w = worker()
    let intercepted = false
    w.listeners.get('fetch')!({ request, respondWith() { intercepted = true } })
    assert.equal(intercepted, false, request.url)
    assert.equal(w.puts(), 0)
  }
})
test('service worker still caches immutable assets and fetches prayer API fresh', async () => {
  for (const [path, expectedPuts] of [['/_next/static/chunk.js', 1], ['/api/prayers', 0]] as const) {
    const w = worker()
    let response: Promise<Response> | undefined
    w.listeners.get('fetch')!({ request: { url: `https://iqama-time.vercel.app${path}`, method: 'GET' }, respondWith(value: Promise<Response>) { response = value } })
    assert.equal(await (await response)?.text(), 'fresh')
    assert.equal(w.fetches(), 1)
    assert.equal(w.puts(), expectedPuts)
  }
})
