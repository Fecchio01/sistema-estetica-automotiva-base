begin;

-- O mesmo veículo pode retornar várias vezes à estética. A relação
-- cliente/veículo continua protegida pelas FKs; apenas o histórico de ordens
-- deixa de ser artificialmente único.
alter table public.work_orders
  drop constraint if exists work_orders_company_client_vehicle_key;

commit;
