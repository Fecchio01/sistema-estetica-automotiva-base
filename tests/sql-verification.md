# Schema and authorization verification

Run these checks against the test Supabase project after applying
`supabase/migrations/20260815_auth_and_operations.sql`. Do not run the fixture
section against the original project. Live schema, policy, constraint, and
security-advisor verification was performed on the test project.

## 1. Schema and RLS inventory

The table lookup must return nine rows, all with `rls_enabled = true`.

```sql
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = any (array[
    'companies', 'profiles', 'clients', 'vehicles', 'work_orders',
    'work_order_photos', 'work_order_notes',
    'work_order_stage_history', 'client_order_tokens'
  ])
order by c.relname;
```

The policy inventory must contain explicit operation policies. It must not
contain the removed broad/self-update policies
`profiles_update_self`, `clients_company_access`,
`vehicles_company_access`, `orders_role_access`,
`photos_order_access`, `notes_order_access`,
`history_order_access`, or `tokens_staff_access`.

```sql
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

## 2. Relationship and actor integrity

These deliberately inconsistent inserts must each fail with a foreign-key
violation when run with otherwise valid fixture UUIDs:

```sql
-- A work order cannot pair a client with another client's vehicle.
insert into public.work_orders (
  company_id, client_id, vehicle_id, service_description
) values (
  :'company_a', :'client_a', :'vehicle_for_client_b', 'must fail'
);

-- A token cannot pair a client with another client's work order.
insert into public.client_order_tokens (
  company_id, client_id, work_order_id, token_hash, expires_at, created_by
) values (
  :'company_a', :'client_a', :'order_for_client_b', repeat('a', 64),
  now() + interval '1 day', :'administrator_a'
);

-- An actor from another tenant cannot be attached to a company A record.
insert into public.work_order_notes (
  company_id, work_order_id, author_id, body
) values (
  :'company_a', :'order_a', :'administrator_b', 'must fail'
);
```

After a valid photo, note, history, or token row exists, changing its actor
column must fail with SQLSTATE `23514` (`check_violation`).

## 3. Role-scoped RLS matrix

Create two companies and authenticated fixture users for company A
(`administrator`, `reception`, assigned `employee`, unassigned `employee`) and
one administrator for company B. Set each request identity with:

```sql
set local role authenticated;
select set_config('request.jwt.claim.sub', :'user_id', true);
```

Verify the following observable results in separate transactions:

| Identity | Operation | Expected result |
| --- | --- | --- |
| Company A employee | Update own `profiles.role`, `company_id`, or `active` | Denied; no self-update policy |
| Company A employee | Select company A clients/vehicles unrelated to assigned orders | 0 rows |
| Company A employee | Insert/update/delete any client or vehicle | Denied |
| Company A employee | Select assigned order and its client, vehicle, photos, notes, and history | Rows visible |
| Company A employee | Select an unassigned order or related records | 0 rows |
| Company A employee | Reassign an assigned order away from self | Denied by `WITH CHECK` |
| Company A reception | Operate company A clients, vehicles, orders, and related records | Allowed |
| Company A administrator | Select/manage company A profile and company records | Allowed |
| Company A administrator | Read or mutate company B records | 0 rows or denied |
| Any caller creating an actor-bearing row | Supply another user's actor UUID | Denied |

Reset the role before fixture cleanup:

```sql
reset role;
```

## 4. Narrow client-token read path (pending explicit endpoint implementation)

Direct anonymous table reads must remain denied. The anonymous RPC is not yet
implemented; add and verify it only after the public client-portal payload is
approved.

```sql
set local role anon;

select * from public.work_orders;          -- must be denied
select * from public.work_order_notes;     -- must be denied
select * from public.client_order_tokens;  -- must be denied

select public.get_client_order(:'valid_raw_token') as payload; -- one JSON object
select public.get_client_order(:'expired_raw_token') as payload; -- NULL
select public.get_client_order(:'revoked_raw_token') as payload; -- NULL
select public.get_client_order(:'invalid_raw_token') as payload; -- NULL
```

For a valid token, the top-level JSON keys must be exactly the following:

```text
order_number, status, scheduled_at, started_at, completed_at,
service_description, vehicle, photos, notes
```

The payload must not contain `company_id`, `client_id`, `internal_description`,
payment fields, token hashes, profile IDs, or internal notes. Seed one public
and one internal note, then verify only the public note body appears:

```sql
with payload as (
  select public.get_client_order(:'valid_raw_token') as body
)
select
  body #>> '{notes,0,body}' = :'public_note_body' as public_note_visible,
  body::text not like '%' || :'internal_note_body' || '%' as internal_note_hidden
from payload;
```

Both booleans must be `true`.

## 5. Repository-local checks

```powershell
git diff --check
git status --short
```

Live Supabase migration replay and role-fixture tests remain pending. The live
test project currently has nine RLS-enabled tables, one policy set per table,
the tenant-bound actor/relationship constraints, and no security-advisor
findings.
