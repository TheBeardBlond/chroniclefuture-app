create table if not exists public.cf_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'inactive',
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  monthly_brief_limit integer not null default 0 check (monthly_brief_limit >= 0),
  monthly_briefs_used integer not null default 0 check (monthly_briefs_used >= 0),
  usage_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  one_time_credits integer not null default 0 check (one_time_credits >= 0),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.cf_billing_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  checkout_session_id text,
  amount_total integer,
  currency text,
  created_at timestamp with time zone not null default now()
);

create index if not exists cf_entitlements_customer_idx
  on public.cf_entitlements(stripe_customer_id);
create index if not exists cf_entitlements_subscription_idx
  on public.cf_entitlements(stripe_subscription_id);
create index if not exists cf_billing_events_user_idx
  on public.cf_billing_events(user_id);

alter table public.cf_entitlements enable row level security;
alter table public.cf_billing_events enable row level security;

revoke all on public.cf_entitlements, public.cf_billing_events from anon;
revoke all on public.cf_billing_events from authenticated;
grant select on public.cf_entitlements to authenticated;

drop policy if exists "entitlements_select_own" on public.cf_entitlements;
create policy "entitlements_select_own"
  on public.cf_entitlements
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

insert into public.cf_entitlements (
  user_id, plan, status, monthly_brief_limit, monthly_briefs_used,
  usage_period_start, current_period_end
)
select
  id, 'owner', 'active', 1000, 0,
  date_trunc('month', now()), now() + interval '10 years'
from auth.users
where id = '62a65da2-32cf-43c5-86f3-11d0f0b7cb5a'::uuid
on conflict (user_id) do update set
  plan = excluded.plan,
  status = excluded.status,
  monthly_brief_limit = excluded.monthly_brief_limit,
  current_period_end = excluded.current_period_end,
  updated_at = now();
