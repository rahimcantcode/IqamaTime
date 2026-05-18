-- Clean up duplicate IANT events and force a consistent app-safe description.
-- Run this once in Supabase SQL Editor after the new scraper helper is wired in.

with ranked as (
  select
    id,
    row_number() over (
      partition by
        lower(regexp_replace(title, '[^a-zA-Z0-9]+', ' ', 'g')),
        event_date,
        coalesce(event_time, '')
      order by
        case when image_url is not null then 0 else 1 end,
        created_at asc
    ) as rn
  from community_events
  where source_name = 'IANT'
)
update community_events
set active = false
where id in (select id from ranked where rn > 1);

update community_events
set description = 'Tap to view full event details from IANT.'
where source_name = 'IANT';
