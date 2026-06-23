create table if not exists public.cf_businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  location_id uuid references public.cf_locations(id) on delete set null,
  name text not null,
  stage text not null default 'idea' check (stage in ('idea', 'validation', 'launch', 'operating', 'scaling')),
  industry text not null default '',
  business_model text not null default '',
  description text not null default '',
  target_customer text not null default '',
  goals text[] not null default '{}',
  funding_need numeric(14,2) not null default 0 check (funding_need >= 0),
  currency text not null default 'USD' check (char_length(currency) = 3),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table if not exists public.cf_business_plans (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'ready')),
  completion integer not null default 0 check (completion between 0 and 100),
  plan jsonb not null default '{}'::jsonb check (jsonb_typeof(plan) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id),
  foreign key (business_id, user_id)
    references public.cf_businesses(id, user_id) on delete cascade
);

create table if not exists public.cf_financial_models (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  currency text not null default 'USD' check (char_length(currency) = 3),
  assumptions jsonb not null default '{}'::jsonb check (jsonb_typeof(assumptions) = 'object'),
  outputs jsonb not null default '{}'::jsonb check (jsonb_typeof(outputs) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id),
  foreign key (business_id, user_id)
    references public.cf_businesses(id, user_id) on delete cascade
);

create table if not exists public.cf_execution_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null default 'manual' check (source_type in ('manual', 'plan', 'swot')),
  category text not null default 'General',
  title text not null,
  description text not null default '',
  priority smallint not null default 3 check (priority between 1 and 5),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  due_date date,
  metric text not null default '',
  expected_impact text not null default '',
  estimated_cost numeric(14,2) not null default 0 check (estimated_cost >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (business_id, user_id)
    references public.cf_businesses(id, user_id) on delete cascade
);

create index if not exists cf_businesses_user_id_idx on public.cf_businesses(user_id);
create index if not exists cf_businesses_location_id_idx on public.cf_businesses(location_id);
create index if not exists cf_business_plans_user_id_idx on public.cf_business_plans(user_id);
create index if not exists cf_financial_models_user_id_idx on public.cf_financial_models(user_id);
create index if not exists cf_execution_items_user_id_idx on public.cf_execution_items(user_id);
create index if not exists cf_execution_items_business_id_idx on public.cf_execution_items(business_id);
create index if not exists cf_execution_items_due_date_idx on public.cf_execution_items(due_date) where status <> 'done';

alter table public.cf_businesses enable row level security;
alter table public.cf_business_plans enable row level security;
alter table public.cf_financial_models enable row level security;
alter table public.cf_execution_items enable row level security;

drop policy if exists "Users manage own businesses" on public.cf_businesses;
create policy "Users manage own businesses"
on public.cf_businesses
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own business plans" on public.cf_business_plans;
create policy "Users manage own business plans"
on public.cf_business_plans
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own financial models" on public.cf_financial_models;
create policy "Users manage own financial models"
on public.cf_financial_models
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own execution items" on public.cf_execution_items;
create policy "Users manage own execution items"
on public.cf_execution_items
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

revoke all on public.cf_businesses from anon;
revoke all on public.cf_business_plans from anon;
revoke all on public.cf_financial_models from anon;
revoke all on public.cf_execution_items from anon;

grant select, insert, update, delete on public.cf_businesses to authenticated;
grant select, insert, update, delete on public.cf_business_plans to authenticated;
grant select, insert, update, delete on public.cf_financial_models to authenticated;
grant select, insert, update, delete on public.cf_execution_items to authenticated;

grant select, insert, update, delete on public.cf_businesses to service_role;
grant select, insert, update, delete on public.cf_business_plans to service_role;
grant select, insert, update, delete on public.cf_financial_models to service_role;
grant select, insert, update, delete on public.cf_execution_items to service_role;
