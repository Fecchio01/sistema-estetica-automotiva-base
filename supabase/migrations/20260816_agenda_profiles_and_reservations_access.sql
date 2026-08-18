begin;

drop policy if exists profiles_select_self on public.profiles;
drop policy if exists profiles_select_staff on public.profiles;
create policy profiles_select_staff on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
  );

create or replace function private.order_refs_belong_to_company(
  p_company_id uuid,
  p_client_id uuid,
  p_vehicle_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, private, pg_temp
as $function$
  select exists (
    select 1
    from public.clients c
    join public.vehicles v on v.id = p_vehicle_id
      and v.client_id = c.id
      and v.company_id = c.company_id
    where c.id = p_client_id
      and c.company_id = p_company_id
  )
$function$;

drop policy if exists orders_insert_staff on public.work_orders;
create policy orders_insert_staff on public.work_orders
  for insert to authenticated
  with check (
    (select private.is_admin_or_reception(company_id))
    and (select private.order_refs_belong_to_company(company_id, client_id, vehicle_id))
  );

commit;
