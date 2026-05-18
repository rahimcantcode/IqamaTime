create extension if not exists pgcrypto;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  username_lower text not null unique,
  pin_hash text not null,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists public.app_user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  session_token text not null unique,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references public.app_users(id) on delete cascade,
  selected_masjid_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_prayer_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  prayer_date date not null,
  prayer text not null,
  prayer_label text not null,
  adhan_time text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, prayer_date, prayer)
);

alter table public.app_users enable row level security;
alter table public.app_user_sessions enable row level security;
alter table public.user_settings enable row level security;
alter table public.user_prayer_checkins enable row level security;

create or replace function public.normalize_app_username(p_username text)
returns text
language sql
immutable
as $$
  select lower(regexp_replace(trim(coalesce(p_username, '')), '[^a-zA-Z0-9_]', '', 'g'));
$$;

create or replace function public.create_private_session(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text;
begin
  v_token := encode(gen_random_bytes(32), 'hex');

  insert into public.app_user_sessions(user_id, session_token)
  values (p_user_id, v_token);

  return v_token;
end;
$$;

create or replace function public.validate_private_session(p_user_id uuid, p_session_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null or coalesce(p_session_token, '') = '' then
    return false;
  end if;

  update public.app_user_sessions
  set last_seen_at = now()
  where user_id = p_user_id and session_token = p_session_token;

  return found;
end;
$$;

create or replace function public.create_app_user(p_username text, p_pin_hash text)
returns table(user_id uuid, username text, session_token text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_user_id uuid;
  v_token text;
begin
  v_username := public.normalize_app_username(p_username);

  if length(v_username) < 3 or length(v_username) > 24 then
    raise exception 'Username must be 3 to 24 characters.';
  end if;

  if coalesce(p_pin_hash, '') = '' then
    raise exception 'PIN is required.';
  end if;

  insert into public.app_users(username, username_lower, pin_hash, last_login_at)
  values (v_username, v_username, p_pin_hash, now())
  returning id into v_user_id;

  insert into public.user_settings(user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  v_token := public.create_private_session(v_user_id);

  return query select v_user_id, v_username, v_token;
exception
  when unique_violation then
    raise exception 'That username is already taken.';
end;
$$;

create or replace function public.login_app_user(p_username text, p_pin_hash text)
returns table(user_id uuid, username text, session_token text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_user_id uuid;
  v_token text;
begin
  v_username := public.normalize_app_username(p_username);

  select id into v_user_id
  from public.app_users
  where username_lower = v_username and pin_hash = p_pin_hash;

  if v_user_id is null then
    raise exception 'Invalid username or PIN.';
  end if;

  update public.app_users
  set last_login_at = now()
  where id = v_user_id;

  insert into public.user_settings(user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  v_token := public.create_private_session(v_user_id);

  return query select v_user_id, v_username, v_token;
end;
$$;

create or replace function public.get_private_user_settings(p_user_id uuid, p_session_token text)
returns table(selected_masjid_ids text[])
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.validate_private_session(p_user_id, p_session_token) then
    raise exception 'Not authenticated.';
  end if;

  insert into public.user_settings(user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  return query
  select us.selected_masjid_ids
  from public.user_settings us
  where us.user_id = p_user_id;
end;
$$;

create or replace function public.save_private_user_settings(
  p_user_id uuid,
  p_session_token text,
  p_selected_masjid_ids text[]
)
returns table(selected_masjid_ids text[])
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.validate_private_session(p_user_id, p_session_token) then
    raise exception 'Not authenticated.';
  end if;

  insert into public.user_settings(user_id, selected_masjid_ids, updated_at)
  values (p_user_id, coalesce(p_selected_masjid_ids, '{}'), now())
  on conflict (user_id)
  do update set selected_masjid_ids = excluded.selected_masjid_ids, updated_at = now();

  return query
  select us.selected_masjid_ids
  from public.user_settings us
  where us.user_id = p_user_id;
end;
$$;

create or replace function public.get_private_prayer_checkins(
  p_user_id uuid,
  p_session_token text,
  p_start_date date default null,
  p_end_date date default null
)
returns table(
  id uuid,
  prayer_date date,
  prayer text,
  prayer_label text,
  adhan_time text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.validate_private_session(p_user_id, p_session_token) then
    raise exception 'Not authenticated.';
  end if;

  return query
  select c.id, c.prayer_date, c.prayer, c.prayer_label, c.adhan_time, c.created_at, c.updated_at
  from public.user_prayer_checkins c
  where c.user_id = p_user_id
    and (p_start_date is null or c.prayer_date >= p_start_date)
    and (p_end_date is null or c.prayer_date <= p_end_date)
  order by c.prayer_date asc, c.prayer asc;
end;
$$;

create or replace function public.upsert_private_prayer_checkin(
  p_user_id uuid,
  p_session_token text,
  p_prayer_date date,
  p_prayer text,
  p_prayer_label text,
  p_adhan_time text default ''
)
returns table(
  id uuid,
  prayer_date date,
  prayer text,
  prayer_label text,
  adhan_time text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.validate_private_session(p_user_id, p_session_token) then
    raise exception 'Not authenticated.';
  end if;

  return query
  insert into public.user_prayer_checkins(user_id, prayer_date, prayer, prayer_label, adhan_time)
  values (p_user_id, p_prayer_date, lower(p_prayer), p_prayer_label, coalesce(p_adhan_time, ''))
  on conflict (user_id, prayer_date, prayer)
  do update set prayer_label = excluded.prayer_label, adhan_time = excluded.adhan_time, updated_at = now()
  returning user_prayer_checkins.id, user_prayer_checkins.prayer_date, user_prayer_checkins.prayer, user_prayer_checkins.prayer_label, user_prayer_checkins.adhan_time, user_prayer_checkins.created_at, user_prayer_checkins.updated_at;
end;
$$;

create or replace function public.delete_private_prayer_checkin(
  p_user_id uuid,
  p_session_token text,
  p_prayer_date date,
  p_prayer text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.validate_private_session(p_user_id, p_session_token) then
    raise exception 'Not authenticated.';
  end if;

  delete from public.user_prayer_checkins
  where user_id = p_user_id
    and prayer_date = p_prayer_date
    and prayer = lower(p_prayer);

  return true;
end;
$$;

grant execute on function public.create_app_user(text, text) to anon, authenticated;
grant execute on function public.login_app_user(text, text) to anon, authenticated;
grant execute on function public.get_private_user_settings(uuid, text) to anon, authenticated;
grant execute on function public.save_private_user_settings(uuid, text, text[]) to anon, authenticated;
grant execute on function public.get_private_prayer_checkins(uuid, text, date, date) to anon, authenticated;
grant execute on function public.upsert_private_prayer_checkin(uuid, text, date, text, text, text) to anon, authenticated;
grant execute on function public.delete_private_prayer_checkin(uuid, text, date, text) to anon, authenticated;
