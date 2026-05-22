-- Seed masjids
insert into masjids (name, city, website_url, active) values
  ('Islamic Center of Rowlett',        'Rowlett',    'https://icrmasjid.org',        true),
  ('EPIC Masjid',                      'Plano',      'https://epicmasjid.org',        true),
  ('American Imams Academy',           'Richardson', 'https://imamsacademy.org',      true),
  ('SMS Masjid of Sachse',             'Sachse',     'https://sachsemasjid.org',      true),
  ('Valley Ranch Islamic Center',      'Irving',     'https://vric.org',              true),
  ('Qalam Institute',                  'Richardson', 'https://qalamcampus.org',       true),
  ('Islamic Association of Collin County', 'Plano',  'https://planomasjid.org',       true),
  ('Masjid Yaseen',                    'Garland',    'https://masjidyaseen.org',      true),
  ('IANT',                             'Richardson', 'https://iant.com',              true),
  ('Islamic Center of Irving',         'Irving',     'https://www.irvingmasjid.org',  true),
  ('Islamic Association of Allen',     'Allen',      'https://allenmasjid.com',        true),
  ('McKinney Islamic Association',     'McKinney',   'https://us.mohid.co/tx/dallas/mia', true),
  ('Islamic Center of Frisco',         'Frisco',     'https://friscomasjid.org',        true)
on conflict do nothing;

-- Sample prayer times for today (update dates as needed)
-- In production, the scraper populates this table daily.
-- This seed is for development/demo purposes only.
do $$
declare
  today date := current_date;
  rid uuid; eid uuid; aid uuid; sid uuid; vid uuid;
  qid uuid; iid uuid; yid uuid; nid uuid; cid uuid;
begin
  select id into rid from masjids where name = 'Islamic Center of Rowlett';
  select id into eid from masjids where name = 'EPIC Masjid';
  select id into aid from masjids where name = 'American Imams Academy';
  select id into sid from masjids where name = 'SMS Masjid of Sachse';
  select id into vid from masjids where name = 'Valley Ranch Islamic Center';
  select id into qid from masjids where name = 'Qalam Institute';
  select id into iid from masjids where name = 'Islamic Association of Collin County';
  select id into yid from masjids where name = 'Masjid Yaseen';
  select id into nid from masjids where name = 'IANT';
  select id into cid from masjids where name = 'Islamic Center of Irving';

  insert into prayer_times (masjid_id, date, fajr, dhuhr, asr, maghrib, isha, jummah1, jummah2)
  values
    (rid, today, '5:47 AM', '1:30 PM', '5:15 PM', '8:06 PM', '9:30 PM', '1:30 PM', '3:00 PM'),
    (eid, today, '5:45 AM', '1:45 PM', '5:15 PM', '8:06 PM', '9:30 PM', '1:45 PM', '3:15 PM'),
    (aid, today, '5:50 AM', '1:30 PM', '5:20 PM', '8:06 PM', '9:35 PM', '1:30 PM', null),
    (sid, today, '5:52 AM', '1:30 PM', '5:15 PM', '8:05 PM', '9:30 PM', '1:30 PM', null),
    (vid, today, '5:48 AM', '1:30 PM', '5:15 PM', '8:06 PM', '9:30 PM', '1:30 PM', '3:00 PM'),
    (qid, today, '5:45 AM', '2:00 PM', '5:15 PM', '8:06 PM', '9:45 PM', '2:00 PM', null),
    (iid, today, '5:47 AM', '1:45 PM', '5:15 PM', '8:06 PM', '9:30 PM', '1:45 PM', null),
    (yid, today, '5:50 AM', '1:30 PM', '5:20 PM', '8:06 PM', '9:30 PM', '1:30 PM', null),
    (nid, today, '5:45 AM', '1:30 PM', '5:15 PM', '8:06 PM', '9:30 PM', '1:30 PM', '3:00 PM'),
    (cid, today, '5:47 AM', '1:30 PM', '5:15 PM', '8:06 PM', '9:30 PM', '1:30 PM', null)
  on conflict (masjid_id, date) do nothing;
end $$;
