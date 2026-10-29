-- Masjid directory only. Never seed invented schedules as current prayer times.
-- Run the scrapers after seeding; an unavailable source must remain unavailable.
-- Preserve the original Qalam ID when upgrading a development database.
update masjids
set name = 'Qalam Masjid', city = 'Carrollton', website_url = 'https://qalamcampus.org'
where name = 'Qalam Institute'
  and not exists (select 1 from masjids where name = 'Qalam Masjid');

insert into masjids (name, city, website_url, active) values
  ('Islamic Center of Rowlett',        'Rowlett',    'https://icrmasjid.org',        true),
  ('EPIC Masjid',                      'Plano',      'https://epicmasjid.org',       true),
  ('American Imams Academy',           'Richardson', 'https://imamsacademy.org',     true),
  ('SMS Masjid of Sachse',             'Sachse',     'https://sachsemasjid.org',     true),
  ('Valley Ranch Islamic Center',      'Irving',     'https://vric.org',             true),
  ('Qalam Masjid',                     'Carrollton', 'https://qalamcampus.org',      true),
  ('Islamic Association of Collin County', 'Plano',  'https://planomasjid.org',      true),
  ('Masjid Yaseen',                    'Garland',    'https://masjidyaseen.org',     true),
  ('IANT',                             'Richardson', 'https://iant.com',             true),
  ('Islamic Center of Irving',         'Irving',     'https://www.irvingmasjid.org', true),
  ('Islamic Association of Allen',     'Allen',      'https://allenmasjid.com',      true),
  ('McKinney Islamic Association',     'McKinney',   'https://mckinneymasjid.org',   true),
  ('Islamic Center of Frisco',         'Frisco',     'https://friscomasjid.org',     true),
  ('MAS Dallas',                       'Richardson', 'https://masdfw.org',           true)
on conflict (name) do update
set city = excluded.city, website_url = excluded.website_url;
