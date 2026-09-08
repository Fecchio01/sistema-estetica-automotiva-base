begin;

alter table public.work_order_stage_history
  drop constraint if exists work_order_stage_history_from_status_check,
  drop constraint if exists work_order_stage_history_to_status_check;

alter table public.work_order_stage_history
  add constraint work_order_stage_history_from_status_check
    check (from_status is null or from_status in ('scheduled', 'in_progress', 'awaiting_approval', 'ready_for_pickup', 'completed', 'cancelled')),
  add constraint work_order_stage_history_to_status_check
    check (to_status in ('scheduled', 'in_progress', 'awaiting_approval', 'ready_for_pickup', 'completed', 'cancelled'));

commit;
