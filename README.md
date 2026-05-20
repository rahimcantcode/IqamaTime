# IqamaTime

A Progressive Web App for Dallas-area Muslims showing prayer and iqama times across local masjids.

Deployment trigger: latest MAS scraper TypeScript fix included.

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
npx tsx scrapers/scrape_all.ts
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
