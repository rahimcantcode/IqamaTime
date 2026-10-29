-- Review and apply separately from a web deployment. This does not delete or
-- rewrite users, sessions, settings or prayer history.
begin;

-- Internal SECURITY DEFINER helpers must only be reached through the public
-- username/PIN login functions and the session-validating RPCs. PostgreSQL
-- grants EXECUTE to PUBLIC by default, independently of table RLS.
revoke all on function public.create_private_session(uuid) from public, anon, authenticated;
revoke all on function public.validate_private_session(uuid, text) from public, anon, authenticated;

-- Unlike the legacy TABLE-returning upsert, this has no OUT column variables
-- that can shadow prayer_date/prayer in ON CONFLICT. Use a new stable name so
-- an existing, out-of-band v2 function's return signature is not overwritten.
create or replace function public.save_private_prayer_checkin_v3(
  p_user_id uuid,
  p_session_token text,
  p_prayer_date date,
  p_prayer text,
  p_prayer_label text,
  p_adhan_time text default ''
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.validate_private_session(p_user_id, p_session_token) then
    raise exception 'Not authenticated.';
  end if;

  if p_prayer_date is null or lower(coalesce(p_prayer, '')) not in ('fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'jummah') then
    raise exception 'Invalid prayer check-in.';
  end if;

  insert into public.user_prayer_checkins(user_id, prayer_date, prayer, prayer_label, adhan_time)
  values (p_user_id, p_prayer_date, lower(p_prayer), p_prayer_label, coalesce(p_adhan_time, ''))
  on conflict (user_id, prayer_date, prayer)
  do update set prayer_label = excluded.prayer_label, adhan_time = excluded.adhan_time, updated_at = now();

  return true;
end;
$$;

revoke all on function public.save_private_prayer_checkin_v3(uuid, text, date, text, text, text) from public;
grant execute on function public.save_private_prayer_checkin_v3(uuid, text, date, text, text, text) to anon, authenticated;

-- Preserve the old RPC's signature for old clients while removing its
-- PL/pgSQL ON CONFLICT ambiguity. Every mutation still validates the session.
create or replace function public.upsert_private_prayer_checkin(
  p_user_id uuid,
  p_session_token text,
  p_prayer_date date,
  p_prayer text,
  p_prayer_label text,
  p_adhan_time text default ''
)
returns table(id uuid, prayer_date date, prayer text, prayer_label text, adhan_time text, created_at timestamptz, updated_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.save_private_prayer_checkin_v3(p_user_id, p_session_token, p_prayer_date, p_prayer, p_prayer_label, p_adhan_time);
  return query
    select c.id, c.prayer_date, c.prayer, c.prayer_label, c.adhan_time, c.created_at, c.updated_at
    from public.user_prayer_checkins c
    where c.user_id = p_user_id and c.prayer_date = p_prayer_date and c.prayer = lower(p_prayer);
end;
$$;

commit;
