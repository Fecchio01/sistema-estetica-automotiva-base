begin;

alter table public.work_orders
  add column if not exists current_stage integer not null default 0;

update public.work_orders
set current_stage = case
  when status in ('ready_for_pickup', 'completed') then 4
  when status = 'in_progress' then 2
  else 0
end
where current_stage is null or current_stage = 0;

alter table public.work_orders
  drop constraint if exists work_orders_current_stage_check;

alter table public.work_orders
  add constraint work_orders_current_stage_check check (current_stage between 0 and 4);

create index if not exists work_orders_company_stage_idx
  on public.work_orders(company_id, current_stage, status);

commit;
