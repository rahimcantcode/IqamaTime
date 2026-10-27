import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 min (Vercel Pro)

/**
 * POST /api/scrape-events
 * Runs all community event scrapers (EPIC, SMS, Qalam, IANT).
 * Protected by SCRAPE_SECRET env var.
 * Called by Vercel cron every Sunday at 07:00 America/Chicago.
 */
export async function POST(req: NextRequest) {
  const secrets = [process.env.CRON_SECRET, process.env.SCRAPE_SECRET].filter(Boolean)
  const auth   = req.headers.get('authorization')

  if (!secrets.length || !secrets.some(secret => auth === `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { scrapeAllCommunityEvents } = await import('@/scrapers/events')
    const { scrapeIANTEvents }         = await import('@/scrapers/iant_events')

    const { scrapeMASEvents } = await import('@/scrapers/mas')
    const results: Record<string, 'ok' | string> = {}

    try {
      await scrapeAllCommunityEvents()
      results['EPIC/SMS/Qalam'] = 'ok'
    } catch (e) {
      results['EPIC/SMS/Qalam'] = e instanceof Error ? e.message : 'error'
    }

    try {
      await scrapeIANTEvents()
      results['IANT'] = 'ok'
    } catch (e) {
      results['IANT'] = e instanceof Error ? e.message : 'error'
    }

    try {
      await scrapeMASEvents()
      results['MAS'] = 'ok'
    } catch (e) {
      results['MAS'] = e instanceof Error ? e.message : 'error'
    }

    const success = Object.values(results).every(result => result === 'ok')
    return NextResponse.json({ success, results }, { status: success ? 200 : 502 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Vercel cron invokes GET
export async function GET(req: NextRequest) {
  return POST(req)
}
