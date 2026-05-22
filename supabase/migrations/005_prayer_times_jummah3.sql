-- Add third jummah slot for masjids with 3 Friday khutbahs (e.g. SMS Masjid of Sachse)
-- Already applied directly to production DB on 2026-05-22
alter table prayer_times add column if not exists jummah3 text;
