create table if not exists public.post_sale_message_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  follow_up_type text not null check (follow_up_type in ('check_in', 'care_tip', 'review', 'return')),
  name text not null,
  message text not null check (length(trim(message)) > 0),
  active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, id),
  unique (company_id, follow_up_type, name),
  foreign key (company_id, created_by) references public.profiles(company_id, id) on delete set null
);

alter table public.post_sale_followups add column if not exists template_id uuid;
alter table public.post_sale_followups add column if not exists auto_send boolean not null default false;
alter table public.post_sale_followups add column if not exists last_error text;
alter table public.post_sale_followups add constraint post_sale_followups_template_fk foreign key (company_id, template_id) references public.post_sale_message_templates(company_id, id) on delete set null;

create index if not exists post_sale_templates_company_type_idx on public.post_sale_message_templates(company_id, follow_up_type, active);
create index if not exists post_sale_auto_pending_idx on public.post_sale_followups(company_id, status, auto_send, due_at);

alter table public.post_sale_message_templates enable row level security;
revoke all on table public.post_sale_message_templates from anon;
grant select, insert, update, delete on table public.post_sale_message_templates to authenticated;
create policy post_sale_templates_select_staff on public.post_sale_message_templates for select to authenticated using (private.is_admin_or_reception(company_id));
create policy post_sale_templates_insert_staff on public.post_sale_message_templates for insert to authenticated with check (created_by = (select auth.uid()) and private.is_admin_or_reception(company_id));
create policy post_sale_templates_update_staff on public.post_sale_message_templates for update to authenticated using (private.is_admin_or_reception(company_id)) with check (private.is_admin_or_reception(company_id));
create policy post_sale_templates_delete_staff on public.post_sale_message_templates for delete to authenticated using (private.is_admin_or_reception(company_id));
