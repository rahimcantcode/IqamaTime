-- IqamaTime Database Schema

create extension if not exists "uuid-ossp";

-- Masjids table
create table if not exists masjids (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  city        text not null,
  website_url text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Prayer times table
create table if not exists prayer_times (
  id          uuid primary key default uuid_generate_v4(),
  masjid_id   uuid not null references masjids(id) on delete cascade,
  date        date not null,
  fajr        text,
  dhuhr       text,
  asr         text,
  maghrib     text,
  isha        text,
  jummah1     text,
  jummah2     text,
  scraped_at  timestamptz not null default now(),
  source_url  text,
  unique (masjid_id, date)
);

-- Scrape log table
create table if not exists scrape_logs (
  id           uuid primary key default uuid_generate_v4(),
  masjid_id    uuid references masjids(id),
  success      boolean not null,
  duration_ms  integer,
  error        text,
  created_at   timestamptz not null default now()
);

-- Indexes
create index if not exists idx_prayer_times_date      on prayer_times(date);
create index if not exists idx_prayer_times_masjid_id on prayer_times(masjid_id);

-- RLS
alter table masjids      enable row level security;
alter table prayer_times enable row level security;
alter table scrape_logs  enable row level security;

-- Public read access (no auth required)
create policy "public read masjids"      on masjids      for select using (true);
create policy "public read prayer_times" on prayer_times  for select using (true);

-- Service role can insert/update (scrapers use service key)
create policy "service insert prayer_times" on prayer_times  for insert with check (true);
create policy "service update prayer_times" on prayer_times  for update using (true);
create policy "service insert scrape_logs"  on scrape_logs   for insert with check (true);
create policy "service insert masjids"      on masjids       for insert with check (true);
