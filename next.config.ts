import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // playwright-core's coreBundle.js requires browsers.json at module load time,
  // but Vercel's file tracer misses it. Force-include it for the scrape route.
  outputFileTracingIncludes: {
    '/api/scrape': ['./node_modules/playwright-core/browsers.json'],
  },

  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control',         value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ]
  },
}

export default nextConfig
