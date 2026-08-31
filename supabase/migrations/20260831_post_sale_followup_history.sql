alter table public.post_sale_followups
  add constraint post_sale_followups_company_id_id_key unique (company_id, id);

create table if not exists public.post_sale_followup_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  follow_up_id uuid not null,
  event_type text not null check (event_type in ('message_edited', 'scheduled', 'automation_disabled', 'sent', 'send_failed', 'undone')),
  channel text check (channel in ('whatsapp', 'system')),
  message_snapshot text,
  error_message text,
  actor_id uuid,
  created_at timestamptz not null default now(),
  foreign key (company_id, follow_up_id) references public.post_sale_followups(company_id, id) on delete cascade,
  foreign key (company_id, actor_id) references public.profiles(company_id, id) on delete set null
);

create index if not exists post_sale_events_follow_up_idx on public.post_sale_followup_events(company_id, follow_up_id, created_at desc);
alter table public.post_sale_followup_events enable row level security;
revoke all on table public.post_sale_followup_events from anon;
grant select, insert on table public.post_sale_followup_events to authenticated;
create policy post_sale_events_select_staff on public.post_sale_followup_events for select to authenticated using (private.is_admin_or_reception(company_id));
create policy post_sale_events_insert_staff on public.post_sale_followup_events for insert to authenticated with check (actor_id = (select auth.uid()) and private.is_admin_or_reception(company_id));
