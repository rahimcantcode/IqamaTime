# Private progress and public-feed permission repair

Migrations `006_private_progress_safety.sql` and
`007_public_feed_write_permissions.sql` require a separately approved database
change. A web deployment does not apply them. Neither migration changes user or
feed records, deletes sessions, or changes public read policies.

## Repository evidence (not a claim about the live database)

- `003_private_profiles.sql` creates SECURITY DEFINER session helpers without
  revoking PostgreSQL's default PUBLIC EXECUTE privilege. Table RLS does not
  restrict a function owner's access inside those helpers.
- Its legacy upsert returns `prayer_date` and `prayer` OUT variables, which can
  conflict with those column names in PL/pgSQL's `ON CONFLICT` expression.
- The seven "service" INSERT/UPDATE policies in migrations 001, 002 and 004 do
  not specify `TO`. Policy names have no authorization effect: the omitted role
  means PUBLIC. Whether anonymous users can write in a deployed database also
  depends on its current table grants.
- The checked-in private tables enable RLS and define no public table policies.
  Legitimate private access is through RPCs that validate a session.

References: [PostgreSQL function security](https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY),
[policy roles](https://www.postgresql.org/docs/current/sql-createpolicy.html),
[Supabase grants and RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Change and compatibility

006 revokes direct access to both internal session helpers, adds a new
session-validated, boolean-returning save-v3 RPC, and retains the legacy upsert
signature with an unambiguous implementation. It deliberately does not replace
an existing out-of-band v2 function, whose live signature is unknown.

The new UI tries v3, then v2, then legacy only for a missing function
(`PGRST202`/`42883`). It does not retry auth, network, or other SQL errors. It can
ship before 006 without removing an existing working v2 save flow. A database
with only the original ambiguous legacy implementation still needs 006 for
reliable saves; the UI now shows failures instead of silently claiming success.

007 scopes the seven write policies to `service_role` and revokes frontend table
mutation privileges. Public feed SELECT policies stay unchanged. Scrapers use
`SUPABASE_SERVICE_ROLE_KEY`; that role's grants remain unchanged.

## Read-only checks before and after an approved application

Run with an authorized administrative database connection, not a browser's anon
key. These inspect definitions and privileges only; they do not read private rows
or create test profiles.

```sql
select schemaname, tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('masjids', 'prayer_times', 'community_events', 'scrape_logs',
                    'app_users', 'app_user_sessions', 'user_settings', 'user_prayer_checkins')
order by tablename, policyname;

select r.rolname, p.proname, pg_get_function_identity_arguments(p.oid) as arguments,
       pg_get_function_result(p.oid) as result, p.prosecdef,
       has_function_privilege(r.oid, p.oid, 'EXECUTE') as can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
cross join pg_roles r
where n.nspname = 'public'
  and r.rolname in ('anon', 'authenticated')
  and p.proname in ('create_private_session', 'validate_private_session',
                   'create_app_user', 'login_app_user', 'get_private_prayer_checkins',
                   'save_private_prayer_checkin_v2', 'save_private_prayer_checkin_v3',
                   'upsert_private_prayer_checkin', 'delete_private_prayer_checkin')
order by r.rolname, p.proname;

select r.rolname, c.relname, c.relrowsecurity,
       has_table_privilege(r.oid, c.oid, 'SELECT') as can_select,
       has_table_privilege(r.oid, c.oid, 'INSERT') as can_insert,
       has_table_privilege(r.oid, c.oid, 'UPDATE') as can_update,
       has_table_privilege(r.oid, c.oid, 'DELETE') as can_delete,
       has_table_privilege(r.oid, c.oid, 'TRUNCATE') as can_truncate
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
cross join pg_roles r
where n.nspname = 'public'
  and r.rolname in ('anon', 'authenticated', 'service_role')
  and c.relname in ('masjids', 'prayer_times', 'community_events', 'scrape_logs')
order by r.rolname, c.relname;
```

After application, anon/authenticated must not execute either internal helper,
while authorized public entry-point RPCs remain callable. Public feed mutation
grants must be false for both frontend roles. The seven write policies must list
only `service_role`. Public read policies should remain intact. Verify service
scraping and a dedicated, explicitly authorized staging profile's
save → reload → remove → reload flow before calling database verification done.

If live definitions differ, inspect them before applying; do not force through a
signature or policy mismatch. Both migrations are transactional. To undo a
functional regression, restore the prior legacy upsert body before removing v3;
keep the helper and feed permission restrictions. Regranting broad permissions
would reintroduce the identified risks and is not the recommended rollback.

## Automated checks and remaining limits

`node --import tsx --test lib/private-auth.test.ts lib/private-progress.test.ts`
uses a fully mocked RPC transport with invented identities, pure date/settings
fixtures, and static SQL assertions. It does **not** verify live database ACLs,
execute migrations, establish production save success, or exercise a real user's
profile. No production private data or credentials are needed for those tests.
