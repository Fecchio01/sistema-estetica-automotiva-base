create table if not exists public.post_sale_followups (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  work_order_id uuid not null,
  client_id uuid not null,
  vehicle_id uuid not null,
  follow_up_type text not null check (follow_up_type in ('check_in', 'care_tip', 'review', 'return')),
  due_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'done', 'dismissed')),
  message text not null,
  sent_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (work_order_id, follow_up_type),
  foreign key (company_id, work_order_id) references public.work_orders(company_id, id) on delete cascade,
  foreign key (company_id, client_id) references public.clients(company_id, id) on delete cascade,
  foreign key (company_id, vehicle_id) references public.vehicles(company_id, id) on delete cascade,
  foreign key (company_id, created_by) references public.profiles(company_id, id) on delete set null
);

alter table public.work_orders drop constraint if exists work_orders_status_check;
alter table public.work_orders add constraint work_orders_status_check check (status in ('scheduled','in_progress','awaiting_approval','ready_for_pickup','completed','cancelled'));

drop policy if exists orders_update_admin_reception on public.work_orders;
create policy orders_update_admin_reception on public.work_orders for update to authenticated
  using (private.is_admin_or_reception(company_id))
  with check (private.is_admin_or_reception(company_id) and private.order_refs_belong_to_company(company_id, client_id, vehicle_id));

create index if not exists post_sale_company_due_idx on public.post_sale_followups(company_id, status, due_at);
alter table public.post_sale_followups enable row level security;
revoke all on table public.post_sale_followups from anon;
grant select, insert, update, delete on table public.post_sale_followups to authenticated;
create policy post_sale_select_staff on public.post_sale_followups for select to authenticated using(private.is_admin_or_reception(company_id));
create policy post_sale_insert_staff on public.post_sale_followups for insert to authenticated with check(created_by = (select auth.uid()) and private.is_admin_or_reception(company_id));
create policy post_sale_update_staff on public.post_sale_followups for update to authenticated using(private.is_admin_or_reception(company_id)) with check(private.is_admin_or_reception(company_id));
create policy post_sale_delete_staff on public.post_sale_followups for delete to authenticated using(private.is_admin_or_reception(company_id));
