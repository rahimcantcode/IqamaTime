import { config } from 'dotenv'
config({ path: '.env.local' })
import { scrapeAllCommunityEvents } from './events'
import { scrapeIANTEvents } from './iant_events'
import { scrapeMASEvents } from './mas'

async function main() {
  const results = await Promise.allSettled([
    scrapeAllCommunityEvents(), scrapeIANTEvents(), scrapeMASEvents(),
  ])
  results.forEach((result, i) => console.log(['EPIC/SMS/Qalam', 'IANT', 'MAS'][i], result.status, result.status === 'rejected' ? String(result.reason) : 'ok'))
  if (results.some(result => result.status === 'rejected')) process.exitCode = 1
}
main().catch(error => { console.error(error); process.exitCode = 1 })
