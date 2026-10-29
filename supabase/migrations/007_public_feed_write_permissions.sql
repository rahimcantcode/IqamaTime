-- Review and apply separately from deployment. No event, prayer, mosque or log
-- records are changed. Keep anonymous SELECT access to the public app feeds.
begin;

-- A policy's name does not restrict its role. The historical "service" write
-- policies omitted TO and therefore applied to PUBLIC, not only service_role.
alter policy "service insert prayer_times" on public.prayer_times to service_role;
alter policy "service update prayer_times" on public.prayer_times to service_role;
alter policy "service insert scrape_logs" on public.scrape_logs to service_role;
alter policy "service insert masjids" on public.masjids to service_role;
alter policy "service update masjids" on public.masjids to service_role;
alter policy "service insert community_events" on public.community_events to service_role;
alter policy "service update community_events" on public.community_events to service_role;

-- Defense in depth: frontend keys do not need table-mutation privileges. The
-- scraper uses SUPABASE_SERVICE_ROLE_KEY, whose grants are left unchanged.
revoke insert, update, delete, truncate on table public.masjids, public.prayer_times, public.community_events from public, anon, authenticated;
revoke all on table public.scrape_logs from public, anon, authenticated;

commit;
