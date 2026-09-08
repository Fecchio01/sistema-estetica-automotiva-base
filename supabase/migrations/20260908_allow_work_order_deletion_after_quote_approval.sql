begin;

-- Aprovado é um registro comercial histórico, mas não deve impedir a remoção
-- da ordem operacional correspondente.
alter table public.sales_quotes
  drop constraint if exists sales_quotes_company_id_work_order_id_fkey;

alter table public.sales_quotes
  add constraint sales_quotes_company_id_work_order_id_fkey
  foreign key (company_id, work_order_id)
  references public.work_orders(company_id, id)
  on delete set null;

commit;
