alter table public.work_orders add column estimate_is_manual boolean not null default false;

create or replace function private.track_order_timing() returns trigger language plpgsql set search_path='' as $$
begin
  if tg_op='INSERT' then
    if new.scheduled_at is null then new.received_at := coalesce(new.received_at,now()); end if;
    new.last_stage_changed_at := now();
    if new.service_duration_minutes is not null and not new.estimate_is_manual then
      new.expected_completion_at := coalesce(new.expected_completion_at,coalesce(new.scheduled_at,now())+make_interval(mins=>new.service_duration_minutes));
    end if;
  else
    if new.current_stage is distinct from old.current_stage or new.status is distinct from old.status then new.last_stage_changed_at := now(); end if;
    if new.received_at is distinct from old.received_at and new.received_at is not null and new.service_duration_minutes is not null and not new.estimate_is_manual then
      new.expected_completion_at := new.received_at+make_interval(mins=>new.service_duration_minutes);
    end if;
  end if;
  if new.status='in_progress' then new.started_at := coalesce(new.started_at,now()); end if;
  if new.status='ready_for_pickup' then new.ready_at := coalesce(new.ready_at,now()); else new.ready_at := null; end if;
  return new;
end $$;
