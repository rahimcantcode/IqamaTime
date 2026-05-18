-- Community events scraped for the Updates feed

create table if not exists community_events (
  id            uuid primary key default uuid_generate_v4(),
  masjid_id     uuid references masjids(id) on delete set null,
  title         text not null,
  event_date    date,
  event_time    text,
  location      text,
  speakers      text,
  description   text,
  image_url     text,
  source_url    text not null,
  source_name   text not null,
  content_hash  text not null unique,
  scraped_at    timestamptz not null default now(),
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists idx_community_events_date on community_events(event_date);
create index if not exists idx_community_events_masjid on community_events(masjid_id);
create index if not exists idx_community_events_active on community_events(active);

alter table community_events enable row level security;

create policy "public read community_events"
  on community_events for select
  using (active = true);

create policy "service insert community_events"
  on community_events for insert
  with check (true);

create policy "service update community_events"
  on community_events for update
  using (true);
