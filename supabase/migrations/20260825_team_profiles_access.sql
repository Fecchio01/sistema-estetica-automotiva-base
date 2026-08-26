begin;

-- Administrators and reception need to list active members from their own company.
-- Employees keep the least-privilege behavior of seeing only their own profile.
drop policy if exists profiles_select_staff on public.profiles;
create policy profiles_select_staff on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or (select private.is_admin_or_reception(company_id))
  );

commit;
