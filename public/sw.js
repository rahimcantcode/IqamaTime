const CACHE_NAME     = 'iqamatime-v4'
const OFFLINE_URL    = '/offline.html'
const STATIC_ASSETS  = [
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-icon-180.png',
]

// ── Install ─────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// ── Activate ────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch ───────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Never intercept account/RPC requests or third-party services.
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  // API calls: network-first, no cache fallback (fresh data matters)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: 'Offline: prayer times unavailable' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    )
    return
  }

  // Navigation: network-first, fallback to offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(OFFLINE_URL))
    )
    return
  }

  // Cache only immutable app assets. Next.js RSC requests and other dynamic
  // page data must reach the network, not an indefinitely stale cache.
  const staticAsset = STATIC_ASSETS.includes(url.pathname) ||
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/fonts/') || url.pathname.startsWith('/icons/')
  if (!staticAsset) return

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((res) => {
        if (res.ok && request.method === 'GET') {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return res
      })
    })
  )
})
