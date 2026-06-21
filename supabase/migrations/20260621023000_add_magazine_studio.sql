create table if not exists public.cf_magazine_issues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  location_id uuid not null references public.cf_locations(id) on delete cascade,
  source_brief_id uuid not null references public.cf_briefs(id) on delete cascade,
  title text not null,
  subtitle text not null default '',
  dek text not null default '',
  editor_note text not null default '',
  edition_date date not null default current_date,
  status text not null default 'draft' check (status in ('draft', 'review', 'published')),
  generation_model text,
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.cf_magazine_articles (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.cf_magazine_issues(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  sort_order integer not null default 0,
  section text not null default 'Intelligence',
  headline text not null,
  subheadline text not null default '',
  byline text not null default 'Chronicle Future Intelligence Desk',
  body text not null default '',
  pull_quote text not null default '',
  source_note text not null default '',
  status text not null default 'draft' check (status in ('draft', 'review', 'approved')),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists cf_magazine_issues_user_idx
  on public.cf_magazine_issues(user_id, created_at desc);
create index if not exists cf_magazine_issues_brief_idx
  on public.cf_magazine_issues(source_brief_id);
create index if not exists cf_magazine_articles_issue_idx
  on public.cf_magazine_articles(issue_id, sort_order);

alter table public.cf_magazine_issues enable row level security;
alter table public.cf_magazine_articles enable row level security;

revoke all on public.cf_magazine_issues, public.cf_magazine_articles from anon;
grant select, insert, update, delete on public.cf_magazine_issues, public.cf_magazine_articles to authenticated;

drop policy if exists "magazine_issues_select_own" on public.cf_magazine_issues;
create policy "magazine_issues_select_own"
  on public.cf_magazine_issues for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "magazine_issues_insert_own" on public.cf_magazine_issues;
create policy "magazine_issues_insert_own"
  on public.cf_magazine_issues for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "magazine_issues_update_own" on public.cf_magazine_issues;
create policy "magazine_issues_update_own"
  on public.cf_magazine_issues for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "magazine_issues_delete_own" on public.cf_magazine_issues;
create policy "magazine_issues_delete_own"
  on public.cf_magazine_issues for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "magazine_articles_select_own" on public.cf_magazine_articles;
create policy "magazine_articles_select_own"
  on public.cf_magazine_articles for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "magazine_articles_insert_own" on public.cf_magazine_articles;
create policy "magazine_articles_insert_own"
  on public.cf_magazine_articles for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.cf_magazine_issues issue
      where issue.id = issue_id and issue.user_id = (select auth.uid())
    )
  );

drop policy if exists "magazine_articles_update_own" on public.cf_magazine_articles;
create policy "magazine_articles_update_own"
  on public.cf_magazine_articles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.cf_magazine_issues issue
      where issue.id = issue_id and issue.user_id = (select auth.uid())
    )
  );

drop policy if exists "magazine_articles_delete_own" on public.cf_magazine_articles;
create policy "magazine_articles_delete_own"
  on public.cf_magazine_articles for delete to authenticated
  using ((select auth.uid()) = user_id);
