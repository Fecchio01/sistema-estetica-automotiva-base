create table public.service_catalog (
  company_id uuid not null references public.companies(id) on delete cascade,
  id text not null,
  name text not null check (length(trim(name)) > 0),
  description text not null default '',
  price numeric(12,2) not null check (price >= 0),
  duration_minutes integer check (duration_minutes > 0 and duration_minutes <= 10080),
  active boolean not null default true,
  primary key(company_id,id), unique(company_id,name)
);
alter table public.service_catalog enable row level security;
revoke all on public.service_catalog from anon;
grant select,insert,update on public.service_catalog to authenticated;
create policy catalog_read on public.service_catalog for select to authenticated using(company_id=private.current_company_id());
create policy catalog_insert on public.service_catalog for insert to authenticated with check(private.is_administrator(company_id));
create policy catalog_update on public.service_catalog for update to authenticated using(private.is_administrator(company_id)) with check(private.is_administrator(company_id));

-- Preserve the catalog already used by the requesting company; durations need its input.
insert into public.service_catalog(company_id,id,name,description,price) values
('6d06a04f-2193-4baf-b8c9-ce2511a7e618','detalhamento-interno','Detalhamento interno','Limpeza detalhada de painel, bancos e portas',280),
('6d06a04f-2193-4baf-b8c9-ce2511a7e618','polimento-tecnico','Polimento técnico','Correção de marcas e proteção da pintura',690),
('6d06a04f-2193-4baf-b8c9-ce2511a7e618','higienizacao-completa','Higienização completa','Estofados, carpetes e teto',420),
('6d06a04f-2193-4baf-b8c9-ce2511a7e618','protecao-ceramica','Proteção cerâmica','Aplicação e cura com acompanhamento',1280);

create table public.sales_quotes (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id),
  client_id uuid not null, vehicle_id uuid not null,
  client_name text not null, vehicle_label text not null,
  items jsonb not null check(jsonb_typeof(items)='array' and jsonb_array_length(items)>0),
  discount numeric(12,2) not null default 0 check(discount>=0),
  status text not null default 'draft' check(status in ('draft','sent','approved','rejected')),
  work_order_id uuid, archived boolean not null default false,
  created_at timestamptz not null default now(),
  foreign key(company_id,client_id) references public.clients(company_id,id),
  foreign key(company_id,vehicle_id) references public.vehicles(company_id,id),
  foreign key(company_id,work_order_id) references public.work_orders(company_id,id)
);
alter table public.sales_quotes enable row level security;
revoke all on public.sales_quotes from anon;
grant select,insert,update on public.sales_quotes to authenticated;
create policy quotes_read on public.sales_quotes for select to authenticated using(private.is_admin_or_reception(company_id));
create policy quotes_insert on public.sales_quotes for insert to authenticated with check(private.is_admin_or_reception(company_id) and status<>'approved' and work_order_id is null and private.order_refs_belong_to_company(company_id,client_id,vehicle_id));
create policy quotes_update on public.sales_quotes for update to authenticated using(private.is_admin_or_reception(company_id) and status<>'approved') with check(private.is_admin_or_reception(company_id) and status<>'approved' and work_order_id is null and private.order_refs_belong_to_company(company_id,client_id,vehicle_id));

alter table public.work_orders
  add column received_at timestamptz,
  add column expected_completion_at timestamptz,
  add column service_duration_minutes integer check(service_duration_minutes>0),
  add column last_stage_changed_at timestamptz,
  add column ready_at timestamptz;

create function private.track_order_timing() returns trigger language plpgsql set search_path='' as $$
begin
  if tg_op='INSERT' then
    if new.scheduled_at is null then new.received_at := coalesce(new.received_at,now()); end if;
    new.last_stage_changed_at := now();
    if new.service_duration_minutes is not null then
      new.expected_completion_at := coalesce(new.expected_completion_at,coalesce(new.scheduled_at,now())+make_interval(mins=>new.service_duration_minutes));
    end if;
  else
    if new.current_stage is distinct from old.current_stage or new.status is distinct from old.status then new.last_stage_changed_at := now(); end if;
    if new.received_at is distinct from old.received_at and new.received_at is not null and new.service_duration_minutes is not null then
      new.expected_completion_at := new.received_at+make_interval(mins=>new.service_duration_minutes);
    end if;
  end if;
  if new.status='in_progress' then new.started_at := coalesce(new.started_at,now()); end if;
  if new.status='ready_for_pickup' then new.ready_at := coalesce(new.ready_at,now()); else new.ready_at := null; end if;
  return new;
end $$;
create trigger track_order_timing before insert or update on public.work_orders for each row execute function private.track_order_timing();

create function public.approve_sales_quote(quote_id uuid) returns public.work_orders
language plpgsql security definer set search_path='' as $$
declare q public.sales_quotes%rowtype; result public.work_orders%rowtype; person uuid; subtotal numeric; minutes integer;
begin
  select * into q from public.sales_quotes where id=quote_id for update;
  if not found or not private.is_admin_or_reception(q.company_id) then raise exception 'Orçamento indisponível.'; end if;
  if q.work_order_id is not null then select * into result from public.work_orders where id=q.work_order_id; return result; end if;
  if q.archived or q.status='rejected' then raise exception 'Reabra o orçamento antes de aprovar.'; end if;
  if not private.order_refs_belong_to_company(q.company_id,q.client_id,q.vehicle_id) then raise exception 'Cliente ou veículo inválido.'; end if;
  if exists(select 1 from jsonb_array_elements(q.items) i where coalesce(trim(i->>'name'),'')='' or (i->>'price') is null or (i->>'price')::numeric<0) then raise exception 'Serviços inválidos.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(q.company_id::text,0));
  select p.id into person from public.profiles p
    where p.company_id=q.company_id and p.active and p.role='employee'
    order by (select count(*) from public.work_orders w where w.responsible_id=p.id and w.company_id=q.company_id and w.status not in ('completed','cancelled')),p.full_name,p.id limit 1;
  person := coalesce(person,auth.uid());
  select sum((i->>'price')::numeric),case when bool_and(coalesce((i->>'durationMinutes')::integer,0)>0) then sum((i->>'durationMinutes')::integer)::integer end into subtotal,minutes from jsonb_array_elements(q.items) i;
  insert into public.work_orders(company_id,client_id,vehicle_id,responsible_id,status,current_stage,service_description,total_amount,discount_amount,payment_status,service_duration_minutes)
    values(q.company_id,q.client_id,q.vehicle_id,person,'scheduled',0,(select string_agg(i->>'name',', ') from jsonb_array_elements(q.items) i),greatest(0,subtotal-q.discount),least(subtotal,q.discount),'pending',minutes) returning * into result;
  update public.sales_quotes set status='approved',work_order_id=result.id where id=q.id;
  return result;
end $$;
revoke all on function public.approve_sales_quote(uuid) from public;
grant execute on function public.approve_sales_quote(uuid) to authenticated;

create function public.check_in_booking(order_id uuid) returns public.work_orders
language plpgsql security definer set search_path='' as $$
declare result public.work_orders%rowtype;
begin
  select * into result from public.work_orders where id=order_id for update;
  if not found or not private.is_admin_or_reception(result.company_id) then raise exception 'Reserva indisponível.'; end if;
  if result.received_at is not null then return result; end if;
  if result.status<>'scheduled' or result.scheduled_at is null then raise exception 'Esta ordem não é uma reserva pendente.'; end if;
  update public.work_orders set received_at=now() where id=order_id returning * into result;
  update public.order_notifications set status='dismissed',auto_send=false where work_order_id=order_id and notification_type='appointment' and status='pending';
  return result;
end $$;
revoke all on function public.check_in_booking(uuid) from public;
grant execute on function public.check_in_booking(uuid) to authenticated;
