import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 min (Vercel Pro)

/**
 * POST /api/scrape
 * Triggers all scrapers. Protected by SCRAPE_SECRET env var.
 * Called by Vercel cron at 23:15 America/Chicago daily.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.SCRAPE_SECRET
  const auth   = req.headers.get('authorization')

  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Dynamic import so scrapers are only loaded when needed (not in edge)
    const { scrapeICR    } = await import('@/scrapers/icr')
    const { scrapeEPIC   } = await import('@/scrapers/epic')
    const { scrapeAIA    } = await import('@/scrapers/aia')
    const { scrapeSMS    } = await import('@/scrapers/sms')
    const { scrapeVRIC   } = await import('@/scrapers/vric')
    const { scrapeQalam  } = await import('@/scrapers/qalam')
    const { scrapeIACC   } = await import('@/scrapers/iacc')
    const { scrapeYaseen } = await import('@/scrapers/yaseen')
    const { scrapeIANT   } = await import('@/scrapers/iant')
    const { scrapeICI    } = await import('@/scrapers/ici')

    const scrapers = [
      { name: 'ICR',    fn: scrapeICR    },
      { name: 'EPIC',   fn: scrapeEPIC   },
      { name: 'AIA',    fn: scrapeAIA    },
      { name: 'SMS',    fn: scrapeSMS    },
      { name: 'VRIC',   fn: scrapeVRIC   },
      { name: 'Qalam',  fn: scrapeQalam  },
      { name: 'IACC',   fn: scrapeIACC   },
    ]

    const heavyScrapers = [
      { name: 'Yaseen', fn: scrapeYaseen },
      { name: 'IANT',   fn: scrapeIANT   },
      { name: 'ICI',    fn: scrapeICI    },
    ]

    const results: Record<string, 'ok' | string> = {}

    // Light scrapers: parallel
    await Promise.all(
      scrapers.map(async s => {
        try {
          await s.fn()
          results[s.name] = 'ok'
        } catch (e) {
          results[s.name] = e instanceof Error ? e.message : 'error'
        }
      })
    )

    // Heavy scrapers: sequential
    for (const s of heavyScrapers) {
      try {
        await s.fn()
        results[s.name] = 'ok'
      } catch (e) {
        results[s.name] = e instanceof Error ? e.message : 'error'
      }
    }

    return NextResponse.json({ success: true, results })
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
