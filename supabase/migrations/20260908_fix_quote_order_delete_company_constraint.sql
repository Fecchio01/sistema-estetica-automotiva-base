begin;

-- SET NULL on a composite foreign key would also null company_id, which is
-- intentionally NOT NULL. Keep the tenant column intact and null only the
-- optional link to the operational order.
alter table public.sales_quotes
  drop constraint if exists sales_quotes_company_id_work_order_id_fkey;

alter table public.sales_quotes
  add constraint sales_quotes_company_id_work_order_id_fkey
  foreign key (work_order_id)
  references public.work_orders(id)
  on delete set null;

commit;
