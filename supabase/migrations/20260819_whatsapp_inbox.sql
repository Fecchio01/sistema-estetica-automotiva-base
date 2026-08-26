create table if not exists public.whatsapp_conversations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  remote_jid text not null,
  contact_name text,
  phone text,
  last_message_preview text,
  last_message_type text not null default 'text' check (last_message_type in ('text','image','video','audio','document','sticker','unknown')),
  unread_count integer not null default 0 check (unread_count >= 0),
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, remote_jid),
  unique (id, company_id)
);

create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  conversation_id uuid not null,
  remote_message_id text not null,
  remote_jid text not null,
  direction text not null check (direction in ('incoming','outgoing')),
  message_type text not null default 'text' check (message_type in ('text','image','video','audio','document','sticker','unknown')),
  body text not null default '',
  status text not null default 'received' check (status in ('received','sent','delivered','read','failed','pending')),
  media_path text,
  media_mime_type text,
  media_size bigint,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (company_id, remote_message_id),
  unique (id, company_id),
  foreign key (conversation_id, company_id) references public.whatsapp_conversations(id, company_id) on delete cascade
);

create table if not exists public.whatsapp_media (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  message_id uuid not null,
  storage_path text not null,
  mime_type text not null,
  file_name text,
  file_size bigint,
  created_at timestamptz not null default now(),
  foreign key (message_id, company_id) references public.whatsapp_messages(id, company_id) on delete cascade
);

create index if not exists whatsapp_conversations_company_activity_idx on public.whatsapp_conversations(company_id, last_message_at desc nulls last);
create index if not exists whatsapp_conversations_client_idx on public.whatsapp_conversations(client_id);
create index if not exists whatsapp_messages_conversation_time_idx on public.whatsapp_messages(company_id, conversation_id, sent_at);
create index if not exists whatsapp_messages_conversation_company_idx on public.whatsapp_messages(conversation_id, company_id);
create index if not exists whatsapp_media_message_idx on public.whatsapp_media(company_id, message_id);
create index if not exists whatsapp_media_message_company_idx on public.whatsapp_media(message_id, company_id);

alter table public.whatsapp_conversations enable row level security;
alter table public.whatsapp_messages enable row level security;
alter table public.whatsapp_media enable row level security;

drop policy if exists whatsapp_conversations_select_staff on public.whatsapp_conversations;
drop policy if exists whatsapp_conversations_insert_staff on public.whatsapp_conversations;
drop policy if exists whatsapp_conversations_update_staff on public.whatsapp_conversations;
drop policy if exists whatsapp_conversations_delete_staff on public.whatsapp_conversations;
create policy whatsapp_conversations_select_staff on public.whatsapp_conversations for select to authenticated using(private.is_admin_or_reception(company_id));
create policy whatsapp_conversations_insert_staff on public.whatsapp_conversations for insert to authenticated with check(private.is_admin_or_reception(company_id));
create policy whatsapp_conversations_update_staff on public.whatsapp_conversations for update to authenticated using(private.is_admin_or_reception(company_id)) with check(private.is_admin_or_reception(company_id));
create policy whatsapp_conversations_delete_staff on public.whatsapp_conversations for delete to authenticated using(private.is_admin_or_reception(company_id));

drop policy if exists whatsapp_messages_select_staff on public.whatsapp_messages;
drop policy if exists whatsapp_messages_insert_staff on public.whatsapp_messages;
drop policy if exists whatsapp_messages_update_staff on public.whatsapp_messages;
create policy whatsapp_messages_select_staff on public.whatsapp_messages for select to authenticated using(private.is_admin_or_reception(company_id));
create policy whatsapp_messages_insert_staff on public.whatsapp_messages for insert to authenticated with check(private.is_admin_or_reception(company_id));
create policy whatsapp_messages_update_staff on public.whatsapp_messages for update to authenticated using(private.is_admin_or_reception(company_id)) with check(private.is_admin_or_reception(company_id));

drop policy if exists whatsapp_media_select_staff on public.whatsapp_media;
drop policy if exists whatsapp_media_insert_staff on public.whatsapp_media;
create policy whatsapp_media_select_staff on public.whatsapp_media for select to authenticated using(private.is_admin_or_reception(company_id));
create policy whatsapp_media_insert_staff on public.whatsapp_media for insert to authenticated with check(private.is_admin_or_reception(company_id));

insert into storage.buckets (id, name, public)
values ('whatsapp-media', 'whatsapp-media', false)
on conflict (id) do update set public = false;

drop policy if exists whatsapp_media_objects_select on storage.objects;
drop policy if exists whatsapp_media_objects_insert on storage.objects;
drop policy if exists whatsapp_media_objects_delete on storage.objects;
create policy whatsapp_media_objects_select on storage.objects for select to authenticated
  using(bucket_id = 'whatsapp-media' and private.is_admin_or_reception((storage.foldername(name))[1]::uuid));
create policy whatsapp_media_objects_insert on storage.objects for insert to authenticated
  with check(bucket_id = 'whatsapp-media' and private.is_admin_or_reception((storage.foldername(name))[1]::uuid));
create policy whatsapp_media_objects_delete on storage.objects for delete to authenticated
  using(bucket_id = 'whatsapp-media' and private.is_admin_or_reception((storage.foldername(name))[1]::uuid));
