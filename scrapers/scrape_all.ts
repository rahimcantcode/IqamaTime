#!/usr/bin/env node
/**
 * Master scraper runner
 * Runs all masjid scrapers and logs results.
 * Schedule: daily at 11:15 PM America/Chicago via cron or Vercel cron.
 *
 * Usage:
 *   npx tsx scrapers/scrape_all.ts
 *   node --loader ts-node/esm scrapers/scrape_all.ts
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { scrapeICR    } from './icr'
import { scrapeEPIC   } from './epic'
import { scrapeAIA    } from './aia'
import { scrapeSMS    } from './sms'
import { scrapeVRIC   } from './vric'
import { scrapeQalam  } from './qalam'
import { scrapeIACC   } from './iacc'
import { scrapeYaseen } from './yaseen'
import { scrapeIANT   } from './iant'
import { scrapeICI    } from './ici'
import { scrapeMAS    } from './mas'
import { scrapeAllen  } from './allen'
import { scrapeMIA    } from './mia'
import { scrapeFrisco } from './frisco'
import { logger } from './logger'

interface ScraperDef {
  name: string
  fn: () => Promise<void>
}

const SCRAPERS: ScraperDef[] = [
  { name: 'ICR',    fn: scrapeICR    },
  { name: 'EPIC',   fn: scrapeEPIC   },
  { name: 'AIA',    fn: scrapeAIA    },
  { name: 'SMS',    fn: scrapeSMS    },
  { name: 'VRIC',   fn: scrapeVRIC   },
  { name: 'Qalam',  fn: scrapeQalam  },
  { name: 'IACC',   fn: scrapeIACC   },
  { name: 'Yaseen', fn: scrapeYaseen },
  { name: 'IANT',   fn: scrapeIANT   },
  { name: 'ICI',    fn: scrapeICI    },
  { name: 'MAS',    fn: scrapeMAS    },
  { name: 'Allen',  fn: scrapeAllen  },
  { name: 'MIA',    fn: scrapeMIA    },
  { name: 'Frisco', fn: scrapeFrisco },
]

const MAX_RETRIES = 2
const RETRY_DELAY_MS = 3000

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function runWithRetry(scraper: ScraperDef): Promise<'success' | 'failed'> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await scraper.fn()
      return 'success'
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (attempt < MAX_RETRIES) {
        logger.warn(scraper.name, `Attempt ${attempt} failed (${msg}). Retrying in ${RETRY_DELAY_MS}ms...`)
        await sleep(RETRY_DELAY_MS)
      } else {
        logger.error(scraper.name, `All ${MAX_RETRIES} attempts failed: ${msg}`)
      }
    }
  }
  return 'failed'
}

async function runAll() {
  const totalStart = Date.now()
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`  IqamaTime Scraper — ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })}`)
  console.log(`${'─'.repeat(60)}\n`)

  const results: { name: string; status: 'success' | 'failed' }[] = []

  // Run scrapers concurrently (light ones) but rate-limit heavy ones
  const lightScrapers  = SCRAPERS.filter(s => !['VRIC', 'AIA', 'Frisco'].includes(s.name))
  const heavyScrapers  = SCRAPERS.filter(s =>  ['VRIC', 'AIA', 'Frisco'].includes(s.name))

  // Light scrapers: run concurrently
  const lightResults = await Promise.all(
    lightScrapers.map(async s => ({ name: s.name, status: await runWithRetry(s) }))
  )
  results.push(...lightResults)

  // Heavy scrapers (Playwright): run sequentially to avoid resource contention
  for (const s of heavyScrapers) {
    results.push({ name: s.name, status: await runWithRetry(s) })
  }

  const duration = ((Date.now() - totalStart) / 1000).toFixed(1)
  const success  = results.filter(r => r.status === 'success').length
  const failed   = results.filter(r => r.status === 'failed').length

  console.log(`\n${'─'.repeat(60)}`)
  console.log(`  Results: ${success} succeeded · ${failed} failed · ${duration}s total`)
  console.log(`${'─'.repeat(60)}`)

  results.forEach(r => {
    const icon = r.status === 'success' ? '✓' : '✗'
    const color = r.status === 'success' ? '\x1b[32m' : '\x1b[31m'
    console.log(`  ${color}${icon}\x1b[0m ${r.name}`)
  })

  console.log()
  process.exit(failed > 0 ? 1 : 0)
}

runAll().catch(err => {
  console.error('Fatal error in scrape_all:', err)
  process.exit(1)
})
