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
