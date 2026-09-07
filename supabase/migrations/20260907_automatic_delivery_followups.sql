create table if not exists public.company_automation_settings (
  company_id uuid primary key references public.companies(id) on delete cascade,
  post_sale_enabled boolean not null default false
);
alter table public.company_automation_settings enable row level security;
revoke all on public.company_automation_settings from anon;
grant select, insert, update on public.company_automation_settings to authenticated;
create policy automation_settings_staff on public.company_automation_settings
  for all to authenticated using (private.is_admin_or_reception(company_id))
  with check (private.is_admin_or_reception(company_id));

create or replace function private.prepare_delivery_followups()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  client_name text;
  vehicle_label text;
  followup record;
  template_message text;
begin
  if new.status <> 'completed' or new.completed_at is null then return new; end if;
  if tg_op = 'UPDATE' then
    if old.status = 'completed' then return new; end if;
  end if;
  if not exists (select 1 from public.company_automation_settings
    where company_id = new.company_id and post_sale_enabled) then return new; end if;
  select full_name into client_name from public.clients where id = new.client_id and company_id = new.company_id;
  select concat_ws(' ', make, model, license_plate) into vehicle_label
    from public.vehicles where id = new.vehicle_id and company_id = new.company_id;
  for followup in select * from (values
    ('check_in', 1, 'Olá, {{cliente}}! Tudo certo com o {{veiculo}} depois do serviço?'),
    ('care_tip', 7, 'Olá, {{cliente}}! Para conservar o resultado do seu {{servico}}, evite produtos abrasivos e conte com nossa equipe quando precisar.'),
    ('review', 15, 'Olá, {{cliente}}! Como você avalia o atendimento? Sua opinião ajuda muito a nossa equipe.'),
    ('return', 30, 'Olá, {{cliente}}! Já faz um tempo desde o cuidado do {{veiculo}}. Quer agendar um retorno?')
  ) as plan(kind, days_after, message) loop
    select message into template_message from public.post_sale_message_templates
      where company_id = new.company_id and follow_up_type = followup.kind and active
      order by updated_at desc nulls last, id limit 1;
    template_message := coalesce(template_message, followup.message);
    template_message := replace(replace(replace(template_message,
      '{{cliente}}', coalesce(client_name, 'cliente')),
      '{{veiculo}}', coalesce(nullif(vehicle_label, ''), 'seu veículo')),
      '{{servico}}', coalesce(new.service_description, 'serviço'));
    insert into public.post_sale_followups
      (company_id, work_order_id, client_id, vehicle_id, follow_up_type, due_at, message, auto_send)
    values (new.company_id, new.id, new.client_id, new.vehicle_id, followup.kind,
      new.completed_at + make_interval(days => followup.days_after), template_message, true)
    on conflict (work_order_id, follow_up_type) do nothing;
  end loop;
  return new;
end;
$$;
revoke all on function private.prepare_delivery_followups() from public;
create trigger prepare_delivery_followups
  after insert or update of status on public.work_orders
  for each row execute function private.prepare_delivery_followups();

create table public.order_notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  work_order_id uuid not null,
  client_id uuid not null,
  notification_type text not null check (notification_type in ('started', 'ready', 'appointment')),
  due_at timestamptz not null,
  message text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'dismissed')),
  auto_send boolean not null default true,
  attempt_count integer not null default 0,
  auto_send_lock_until timestamptz,
  last_error text,
  sent_at timestamptz,
  unique (work_order_id, notification_type),
  foreign key (company_id, work_order_id) references public.work_orders(company_id,id) on delete cascade,
  foreign key (company_id, client_id) references public.clients(company_id,id) on delete cascade
);
alter table public.order_notifications enable row level security;
revoke all on public.order_notifications from anon;
grant select, update on public.order_notifications to authenticated;
create policy order_notifications_read on public.order_notifications for select to authenticated
  using (private.is_admin_or_reception(company_id));
create policy order_notifications_update on public.order_notifications for update to authenticated
  using (private.is_admin_or_reception(company_id)) with check (private.is_admin_or_reception(company_id));
create index order_notifications_due on public.order_notifications(company_id, due_at) where status='pending' and auto_send;

create or replace function private.prepare_order_notifications()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  kind text;
  body text;
  customer text;
  vehicle text;
  due timestamptz := now();
begin
  -- Remove reminders made obsolete by cancellation, rescheduling or progression.
  if tg_op = 'UPDATE' then
    if new.status <> 'scheduled' or new.scheduled_at is distinct from old.scheduled_at then
      update public.order_notifications set status='dismissed', auto_send=false
        where work_order_id=new.id and notification_type='appointment' and status='pending';
    end if;
    if new.status <> 'in_progress' then
      update public.order_notifications set status='dismissed', auto_send=false
        where work_order_id=new.id and notification_type='started' and status='pending';
    end if;
    if new.status <> 'ready_for_pickup' then
      update public.order_notifications set status='dismissed', auto_send=false
        where work_order_id=new.id and notification_type='ready' and status='pending';
    end if;
    if new.status in ('cancelled','in_progress','scheduled','ready_for_pickup') and old.status='completed' then
      update public.post_sale_followups set status='dismissed', auto_send=false
        where work_order_id=new.id and status='pending';
    end if;
    if new.status is not distinct from old.status and new.scheduled_at is not distinct from old.scheduled_at then return new; end if;
  end if;
  if not exists (select 1 from public.company_automation_settings where company_id=new.company_id and post_sale_enabled) then return new; end if;
  select full_name into customer from public.clients where id=new.client_id and company_id=new.company_id;
  select concat_ws(' ',make,model,license_plate) into vehicle from public.vehicles where id=new.vehicle_id and company_id=new.company_id;
  if new.status='ready_for_pickup' then
    kind := 'ready'; body := 'Seu ' || vehicle || ' está pronto para retirada. Fale com nossa equipe para combinar a entrega.';
  elsif new.status='in_progress' then
    kind := 'started'; body := 'Iniciamos o atendimento do seu ' || vehicle || '. Avisaremos quando estiver pronto para retirada.';
  elsif new.status='scheduled' and new.scheduled_at > now() then
    kind := 'appointment'; due := greatest(now(),new.scheduled_at - interval '24 hours');
    body := 'Lembrete: seu atendimento para ' || vehicle || ' está agendado para ' || to_char(new.scheduled_at at time zone 'America/Sao_Paulo','DD/MM/YYYY "às" HH24:MI') || '. Se precisar remarcar, responda esta mensagem.';
  else return new;
  end if;
  insert into public.order_notifications(company_id,work_order_id,client_id,notification_type,due_at,message)
    values(new.company_id,new.id,new.client_id,kind,due,'Olá, ' || coalesce(customer,'cliente') || '! ' || body)
    on conflict (work_order_id,notification_type) do update
      set due_at=excluded.due_at,message=excluded.message,status='pending',auto_send=true
      where order_notifications.status='dismissed' and excluded.notification_type='appointment';
  return new;
end;
$$;
revoke all on function private.prepare_order_notifications() from public;
create trigger prepare_order_notifications after insert or update of status,scheduled_at on public.work_orders
  for each row execute function private.prepare_order_notifications();
