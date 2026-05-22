-- Ensure masjid names are unique so ensureMasjid can use ON CONFLICT (name)
-- and duplicate rows from multiple seed runs or race conditions are impossible.
alter table masjids add constraint masjids_name_unique unique (name);

-- Allow service role to update masjids (needed for ensureMasjid upsert
-- which sets active=true on existing rows via ON CONFLICT DO UPDATE).
create policy "service update masjids"
  on masjids for update
  using (true);
