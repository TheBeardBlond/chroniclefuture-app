alter table public.cf_briefs
  add column if not exists title text,
  add column if not exists summary text,
  add column if not exists content jsonb;

alter table public.cf_signals
  add column if not exists brief_id uuid references public.cf_briefs(id) on delete cascade;

alter table public.cf_signal_scores
  add column if not exists brief_id uuid references public.cf_briefs(id) on delete cascade;

alter table public.cf_opportunities
  add column if not exists brief_id uuid references public.cf_briefs(id) on delete cascade;

alter table public.cf_risks
  add column if not exists brief_id uuid references public.cf_briefs(id) on delete cascade,
  add column if not exists severity text,
  add column if not exists time_horizon text,
  add column if not exists mitigation text;

alter table public.cf_swots
  add column if not exists brief_id uuid references public.cf_briefs(id) on delete cascade;

create index if not exists cf_briefs_user_id_idx on public.cf_briefs(user_id);
create index if not exists cf_briefs_location_id_idx on public.cf_briefs(location_id);
create index if not exists cf_signals_brief_id_idx on public.cf_signals(brief_id);
create index if not exists cf_signal_scores_brief_id_idx on public.cf_signal_scores(brief_id);
create index if not exists cf_opportunities_brief_id_idx on public.cf_opportunities(brief_id);
create index if not exists cf_risks_brief_id_idx on public.cf_risks(brief_id);
create index if not exists cf_swots_brief_id_idx on public.cf_swots(brief_id);

alter table public.cf_locations enable row level security;
alter table public.cf_briefs enable row level security;
alter table public.cf_signals enable row level security;
alter table public.cf_signal_scores enable row level security;
alter table public.cf_opportunities enable row level security;
alter table public.cf_risks enable row level security;
alter table public.cf_swots enable row level security;
alter table public.cf_chat_sessions enable row level security;
alter table public.cf_chat_messages enable row level security;
alter table public.profiles enable row level security;

revoke all on public.cf_locations, public.cf_briefs, public.cf_signals,
  public.cf_signal_scores, public.cf_opportunities, public.cf_risks,
  public.cf_swots, public.cf_chat_sessions, public.cf_chat_messages,
  public.profiles from anon;

grant select, insert, update, delete on public.cf_locations to authenticated;
grant select on public.cf_briefs, public.cf_signals, public.cf_signal_scores,
  public.cf_opportunities, public.cf_risks, public.cf_swots to authenticated;
grant select, insert on public.cf_chat_sessions, public.cf_chat_messages to authenticated;
grant select, insert, update on public.profiles to authenticated;

drop policy if exists "locations_select_own" on public.cf_locations;
create policy "locations_select_own" on public.cf_locations for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "locations_insert_own" on public.cf_locations;
create policy "locations_insert_own" on public.cf_locations for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists "locations_update_own" on public.cf_locations;
create policy "locations_update_own" on public.cf_locations for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "locations_delete_own" on public.cf_locations;
create policy "locations_delete_own" on public.cf_locations for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "briefs_select_own" on public.cf_briefs;
create policy "briefs_select_own" on public.cf_briefs for select to authenticated
  using (
    (select auth.uid()) = user_id or exists (
      select 1 from public.cf_locations l
      where l.id = cf_briefs.location_id and l.user_id = (select auth.uid())
    )
  );

drop policy if exists "signals_select_own" on public.cf_signals;
create policy "signals_select_own" on public.cf_signals for select to authenticated
  using (exists (
    select 1 from public.cf_locations l
    where l.id = cf_signals.location_id and l.user_id = (select auth.uid())
  ));

drop policy if exists "signal_scores_select_own" on public.cf_signal_scores;
create policy "signal_scores_select_own" on public.cf_signal_scores for select to authenticated
  using (exists (
    select 1 from public.cf_signals s
    join public.cf_locations l on l.id = s.location_id
    where s.id = cf_signal_scores.signal_id and l.user_id = (select auth.uid())
  ));

drop policy if exists "opportunities_select_own" on public.cf_opportunities;
create policy "opportunities_select_own" on public.cf_opportunities for select to authenticated
  using (exists (
    select 1 from public.cf_locations l
    where l.id = cf_opportunities.location_id and l.user_id = (select auth.uid())
  ));

drop policy if exists "risks_select_own" on public.cf_risks;
create policy "risks_select_own" on public.cf_risks for select to authenticated
  using (exists (
    select 1 from public.cf_locations l
    where l.id = cf_risks.location_id and l.user_id = (select auth.uid())
  ));

drop policy if exists "swots_select_own" on public.cf_swots;
create policy "swots_select_own" on public.cf_swots for select to authenticated
  using (exists (
    select 1 from public.cf_locations l
    where l.id = cf_swots.location_id and l.user_id = (select auth.uid())
  ));

drop policy if exists "chat_sessions_select_own" on public.cf_chat_sessions;
create policy "chat_sessions_select_own" on public.cf_chat_sessions for select to authenticated
  using (exists (
    select 1 from public.cf_locations l
    where l.id = cf_chat_sessions.location_id and l.user_id = (select auth.uid())
  ));
drop policy if exists "chat_sessions_insert_own" on public.cf_chat_sessions;
create policy "chat_sessions_insert_own" on public.cf_chat_sessions for insert to authenticated
  with check (exists (
    select 1 from public.cf_locations l
    where l.id = cf_chat_sessions.location_id and l.user_id = (select auth.uid())
  ));

drop policy if exists "chat_messages_select_own" on public.cf_chat_messages;
create policy "chat_messages_select_own" on public.cf_chat_messages for select to authenticated
  using (exists (
    select 1 from public.cf_chat_sessions s
    join public.cf_locations l on l.id = s.location_id
    where s.id = cf_chat_messages.session_id and l.user_id = (select auth.uid())
  ));
drop policy if exists "chat_messages_insert_own" on public.cf_chat_messages;
create policy "chat_messages_insert_own" on public.cf_chat_messages for insert to authenticated
  with check (exists (
    select 1 from public.cf_chat_sessions s
    join public.cf_locations l on l.id = s.location_id
    where s.id = cf_chat_messages.session_id and l.user_id = (select auth.uid())
  ));

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end
$$;
