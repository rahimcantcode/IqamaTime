# IqamaTime

A Progressive Web App for Dallas-area Muslims showing prayer and iqama times across local masjids.

Live app: https://iqama-time.vercel.app/

## Features

- Swipeable prayer cards for Fajr, Dhuhr, Asr, Maghrib, and Isha
- Jumu'ah mode on Fridays
- Live countdown to prayer times
- Iqama times from Dallas-area masjids
- Installable PWA for iPhone Home Screen
- Daily scraping for masjid data

## Tech Stack

- Next.js App Router with TypeScript
- Tailwind CSS
- Framer Motion
- Supabase PostgreSQL
- Axios, Cheerio, and Playwright for scraping
- Vercel hosting

## Deployment

Add these environment variables in Vercel:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- SCRAPE_SECRET

## Running Scrapers

```bash
npm run scrape
```

## Masjids Included

- Islamic Center of Rowlett
- EPIC Masjid
- American Imams Academy
- SMS Masjid of Sachse
- Valley Ranch Islamic Center
- Qalam Institute
- Islamic Association of Collin County
- Masjid Yaseen
- IANT
- Islamic Center of Irving
- MAS Dallas

## Refresh and verification

Prayer schedules refresh at 06:17 UTC daily, after midnight in Dallas in both
standard and daylight time. Vercel runs `/api/scrape`; the active GitHub backup
is `.github/workflows/mosque-prayers.yml`. Community events refresh weekly via
Vercel and `.github/workflows/mosque-events.yml`. GitHub may disable schedules
after 60 days of repository inactivity; the independent Vercel schedules remain.
Both HTTP refresh routes require a Bearer token matching `CRON_SECRET` or
`SCRAPE_SECRET`. Set `CRON_SECRET` in production so Vercel sends it automatically.
Never treat the caller-controlled `x-vercel-cron` header as authentication.

Run `npm test`, `npm run lint`, and `npm run build` before publishing.
Run a read-only source check with `SCRAPE_DRY_RUN=1 npm run scrape`.
Optionally select sources with `SCRAPE_ONLY=ICR,MAS,MIA`.
Run `npm run scrape:events` for all supported community event scrapers.
A missing daily prayer or failed database write fails the job. Existing rows
are preserved when parsing fails. The app labels previous-day fallback data
and links to the mosque website when a time is unavailable.

Current source repairs (October 2026): Rowlett uses its published CMZ widget,
MAS Dallas uses the matching year/day in its official annual JavaScript schedule,
and McKinney uses AthanPlus embedded on mckinneymasjid.org. MAS fails explicitly
when the annual schedule year expires rather than silently reusing last year's
values. Friday values are khutbah start times, as published by the mosques.

## Quality and safe refreshes

Use Node.js 24 and run `npm run check` (all fixture tests, lint, TypeScript, and
production build). The quality workflow runs without production credentials.
Tests cover date/source guards, event parsing and preservation, mocked private
profile RPCs, and service-worker cache boundaries. Mocks are not proof that a
production account can save successfully.

For a local installed browser, optionally set
`PLAYWRIGHT_EXECUTABLE_PATH=/path/to/chromium`. Otherwise install Playwright's
Chromium normally. A source-only check never needs a database credential:
`SCRAPE_DRY_RUN=1 npm run scrape` or `SCRAPE_DRY_RUN=1 npm run scrape:events`.

Source failures intentionally fail the refresh job while preserving existing
usable data. Do not replace missing iqamas with adhan times, calculated values
without a published relative rule, search-engine snippets, or another day's
schedule. On October 29, Sachse's official site rendered broken MadinaAPPS
shortcodes, and the AthanPlus day widgets advanced to October 30 before Dallas
midnight. These are external source limitations, not evidence for new times.

The default database seed is directory metadata only; it never creates sample
prayer times under today's date. Migrations `006_private_progress_safety.sql`
and `007_public_feed_write_permissions.sql` require separate database review and
approval; deploying the web app does not apply them. The new save RPC falls back
to existing RPCs only when a function is explicitly missing, never after an
uncertain write failure. Preserve anonymous read access when hardening public
feed write permissions.
