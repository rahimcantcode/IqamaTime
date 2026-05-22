-- Ensure masjid names are unique so ensureMasjid can use ON CONFLICT (name)
-- and duplicate rows from multiple seed runs or race conditions are impossible.
alter table masjids add constraint masjids_name_unique unique (name);
