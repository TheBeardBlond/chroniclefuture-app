alter table public.reports enable row level security;
revoke all on public.reports from anon, authenticated;

drop policy if exists "reports_no_client_access" on public.reports;
create policy "reports_no_client_access"
  on public.reports
  for select
  to authenticated
  using (false);
