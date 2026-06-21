create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  town text,
  state text,
  zip text,
  data jsonb,
  created_at timestamp without time zone default now()
);

create table if not exists public.cf_locations (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  state text not null,
  zip text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  user_id uuid references auth.users(id)
);

create table if not exists public.cf_briefs (
  id uuid primary key default gen_random_uuid(),
  location_id uuid references public.cf_locations(id) on delete cascade,
  week_of date,
  local_signals text,
  state_signals text,
  national_signals text,
  global_signals text,
  technology_watch text,
  commodity_watch text,
  decade_outlook text,
  created_at timestamp with time zone default now(),
  user_id uuid references auth.users(id)
);

create table if not exists public.cf_signals (
  id uuid primary key default gen_random_uuid(),
  location_id uuid references public.cf_locations(id) on delete cascade,
  signal_type text not null,
  title text not null,
  summary text not null,
  source text,
  signal_date timestamp with time zone,
  created_at timestamp with time zone default now()
);

create table if not exists public.cf_signal_scores (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid not null references public.cf_signals(id) on delete cascade,
  impact_score integer,
  confidence_score integer,
  urgency_score integer,
  created_at timestamp with time zone default now()
);

create table if not exists public.cf_opportunities (
  id uuid primary key default gen_random_uuid(),
  location_id uuid references public.cf_locations(id) on delete cascade,
  title text not null,
  description text,
  opportunity_score integer,
  confidence_level integer,
  capital_requirement text,
  time_horizon text,
  created_at timestamp with time zone default now()
);

create table if not exists public.cf_risks (
  id uuid primary key default gen_random_uuid(),
  location_id uuid references public.cf_locations(id) on delete cascade,
  title text not null,
  description text,
  risk_score integer,
  confidence_level integer,
  created_at timestamp with time zone default now()
);

create table if not exists public.cf_swots (
  id uuid primary key default gen_random_uuid(),
  location_id uuid references public.cf_locations(id) on delete cascade,
  strengths jsonb,
  weaknesses jsonb,
  opportunities jsonb,
  threats jsonb,
  created_at timestamp with time zone default now()
);

create table if not exists public.cf_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  location_id uuid references public.cf_locations(id) on delete set null,
  title text,
  created_at timestamp with time zone default now()
);

create table if not exists public.cf_chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.cf_chat_sessions(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamp with time zone default now()
);
