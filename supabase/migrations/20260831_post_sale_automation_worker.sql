alter table public.post_sale_followups
  add column if not exists attempt_count integer not null default 0 check (attempt_count >= 0),
  add column if not exists auto_send_lock_until timestamptz;

create index if not exists post_sale_auto_claim_idx on public.post_sale_followups(company_id, status, auto_send, due_at, auto_send_lock_until);
