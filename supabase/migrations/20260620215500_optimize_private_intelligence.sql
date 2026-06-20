create index if not exists cf_chat_sessions_location_id_idx
  on public.cf_chat_sessions(location_id);
create index if not exists cf_locations_user_id_idx
  on public.cf_locations(user_id);
create index if not exists cf_signal_scores_signal_id_idx
  on public.cf_signal_scores(signal_id);
create index if not exists cf_swots_location_id_idx
  on public.cf_swots(location_id);

drop index if exists public.cf_briefs_location_id_idx;

drop policy if exists "users_can_view_own_profile" on public.profiles;
drop policy if exists "users_can_insert_own_profile" on public.profiles;
drop policy if exists "users_can_update_own_profile" on public.profiles;
