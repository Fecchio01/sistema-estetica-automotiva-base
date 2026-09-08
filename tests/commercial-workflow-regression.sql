-- Execute no SQL Editor. Toda a massa criada neste teste é revertida.
begin;
select set_config('request.jwt.claim.sub',(select id::text from public.profiles where company_id='6d06a04f-2193-4baf-b8c9-ce2511a7e618' and role='administrator' and active limit 1),true);
set local role authenticated;
do $$
declare f public.work_orders%rowtype; q uuid; a public.work_orders%rowtype; b public.work_orders%rowtype; manual_due timestamptz := now()+interval '4 days';
begin
  select * into f from public.work_orders limit 1;
  if f.id is null then raise exception 'É necessária uma ordem de referência.'; end if;
  insert into public.sales_quotes(company_id,client_id,vehicle_id,client_name,vehicle_label,items,discount)
    values(f.company_id,f.client_id,f.vehicle_id,'Teste transacional','Veículo de teste','[{"name":"Teste","price":200,"durationMinutes":90}]',10) returning id into q;
  select * into a from public.approve_sales_quote(q);
  select * into b from public.approve_sales_quote(q);
  if a.id<>b.id or a.total_amount<>190 or a.payment_status<>'pending' or a.expected_completion_at is null then raise exception 'Falha na aprovação'; end if;
  insert into public.work_orders(company_id,client_id,vehicle_id,responsible_id,service_description,status,scheduled_at,service_duration_minutes)
    values(f.company_id,f.client_id,f.vehicle_id,f.responsible_id,'Teste reserva','scheduled',now()+interval '2 days',60) returning * into a;
  select * into a from public.check_in_booking(a.id);
  select * into b from public.check_in_booking(a.id);
  if a.id<>b.id or a.received_at is null or a.received_at<>b.received_at or a.expected_completion_at<>a.received_at+interval '60 minutes' then raise exception 'Falha na chegada'; end if;
  insert into public.work_orders(company_id,client_id,vehicle_id,responsible_id,service_description,status,scheduled_at,service_duration_minutes,expected_completion_at,estimate_is_manual)
    values(f.company_id,f.client_id,f.vehicle_id,f.responsible_id,'Teste prazo manual','scheduled',now()+interval '2 days',60,manual_due,true) returning * into a;
  select * into a from public.check_in_booking(a.id);
  if a.expected_completion_at<>manual_due then raise exception 'Prazo manual foi sobrescrito'; end if;
end $$;
rollback;
