import type { Browser } from 'playwright-core'

// Sparticuz chromium pack — exact match for playwright-core 1.60 / Chromium 148
const CHROMIUM_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v148.0.0/chromium-v148.0.0-pack.x64.tar'

/**
 * Launch a browser appropriate for the current environment.
 *
 * On Vercel serverless, Playwright's bundled Chromium is not present.
 * @sparticuz/chromium-min downloads a Lambda-compatible binary at runtime
 * and caches it for subsequent invocations.
 *
 * Locally, the regular playwright package is used (requires `playwright install`).
 */
export async function launchBrowser(): Promise<Browser> {
  if (process.env.VERCEL) {
    const chromium = (await import('@sparticuz/chromium-min')).default
    const { chromium: pw } = await import('playwright-core')
    return pw.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(CHROMIUM_URL),
      headless: true,
    })
  }

  const { chromium } = await import('playwright')
  return chromium.launch({ headless: true })
}
