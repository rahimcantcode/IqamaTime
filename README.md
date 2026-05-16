# IqamaTime

A production-ready Progressive Web App for Dallas-area Muslims — beautifully showing the **next prayer** and **iqama times** across 10 local masjids.

Built to feel like a native iOS app: calm, elegant, swipeable, minimal.

---

## Features

- **Swipeable prayer cards** — Fajr · Dhuhr · Asr · Maghrib · Isha
- **Auto-opens to the next prayer** when you launch the app
- **Jumu'ah mode** — automatically replaces Dhuhr on Fridays
- **Live countdown** to each prayer's adhan time
- **Iqama times** from 10 Dallas-area masjids, sorted earliest first
- **Dark mode** elegant UI (Apple-quality design)
- **PWA** — installable to iPhone home screen, works offline
- **Daily scraping** — all 10 masjids scraped automatically

---

## Tech Stack

| Layer      | Technology                                    |
|------------|-----------------------------------------------|
| Framework  | Next.js 15 App Router + TypeScript            |
| Styling    | Tailwind CSS v4 + custom design tokens        |
| Animation  | Framer Motion (spring physics)                |
| Database   | Supabase (PostgreSQL)                         |
| Scraping   | Axios + Cheerio + Playwright                  |
| Icons      | Sharp (SVG → PNG generation)                  |
| Hosting    | Vercel (with built-in cron)                   |

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/your-username/iqamatime
cd iqamatime
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials (see `.env.example`).

> **Without Supabase:** The app runs on beautiful mock data automatically — no config needed to start.

### 3. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → run `supabase/migrations/001_initial_schema.sql`
3. Run `supabase/seed.sql` to populate masjids + sample prayer times

### 4. Generate Icons (optional, already generated)

```bash
node scripts/generate-icons.mjs
```

### 5. Run Locally

```bash
npm run dev
```

Open `http://localhost:3000` in iPhone Safari → tap Share → **Add to Home Screen** for the full PWA experience.

---

## Deployment (Vercel)

```bash
vercel --prod
```

Add environment variables in Vercel Project Settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SCRAPE_SECRET`

The `vercel.json` cron runs `/api/scrape` daily.

**Cron schedule note (America/Chicago):**
- CDT (UTC-5, Mar–Nov): `15 4 * * *`
- CST (UTC-6, Nov–Mar): `15 5 * * *`

---

## Running Scrapers Manually

```bash
# All scrapers
npx tsx scrapers/scrape_all.ts

# Single scraper
npx tsx -e "import('./scrapers/epic.ts').then(m => m.scrapeEPIC())"
```

---

## Masjids Included

| Masjid                              | City        | Scraper |
|-------------------------------------|-------------|---------|
| Islamic Center of Rowlett           | Rowlett     | icr.ts  |
| EPIC Masjid                         | Plano       | epic.ts |
| American Imams Academy              | Richardson  | aia.ts  |
| SMS Masjid of Sachse                | Sachse      | sms.ts  |
| Valley Ranch Islamic Center         | Irving      | vric.ts |
| Qalam Institute                     | Richardson  | qalam.ts|
| Islamic Assoc. of Collin County     | Plano       | iacc.ts |
| Masjid Yaseen                       | Garland     | yaseen.ts |
| IANT                                | Richardson  | iant.ts |
| Islamic Center of Irving            | Irving      | ici.ts  |

---

## Project Structure

```
IqamaTime/
├── app/                      # Next.js App Router
│   ├── layout.tsx            # Root layout + PWA meta
│   ├── page.tsx              # Server component — fetches Supabase data
│   ├── globals.css           # Design system + Tailwind v4
│   └── api/
│       ├── prayers/route.ts  # GET today's prayer times
│       └── scrape/route.ts   # POST triggers scrapers (cron endpoint)
├── components/
│   ├── dashboard.tsx         # Main client orchestrator
│   ├── prayer-carousel.tsx   # Framer Motion swipeable carousel
│   ├── prayer-card.tsx       # Individual prayer card (gradient + countdown)
│   ├── masjid-list.tsx       # Iqama time rows with sort + past-state
│   ├── countdown-display.tsx # Live animated countdown
│   ├── app-header.tsx        # Clock + Gregorian + Hijri + next prayer
│   ├── navigation-dots.tsx   # Prayer tab indicator
│   └── settings-sheet.tsx    # Bottom sheet (masjid filter, refresh)
├── scrapers/                 # All 10 masjid scrapers + utilities
├── hooks/                    # useCountdown, useNextPrayer, useSettings
├── lib/                      # prayer-utils, mock-data, supabase clients
├── types/index.ts
├── supabase/                 # SQL migrations + seed
├── public/
│   ├── manifest.json
│   ├── sw.js                 # Service worker (cache-first static, network-first API)
│   ├── offline.html
│   └── icons/                # All PWA icon sizes (72–512px + splashes)
└── scripts/generate-icons.mjs
```

---

## Design System

| Token         | Value     | Use                        |
|---------------|-----------|----------------------------|
| Background    | `#080810` | App base                   |
| Card bg       | `#0f0f1a` | Settings sheet             |
| Emerald       | `#10B981` | Primary accent             |
| Emerald light | `#34D399` | Highlights, active dots    |
| Gold          | `#F59E0B` | Premium detail, Jumu'ah    |
| Fajr          | Indigo    | Pre-dawn card glow         |
| Asr           | Amber     | Afternoon card glow        |
| Maghrib       | Orange    | Sunset card glow           |
| Isha          | Violet    | Night card glow            |

---

## License

MIT — build something beautiful, for the sake of Allah.
