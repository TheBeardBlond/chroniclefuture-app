drop policy if exists "magazine_issues_select_own" on public.cf_magazine_issues;
drop policy if exists "magazine_issues_insert_own" on public.cf_magazine_issues;
drop policy if exists "magazine_issues_update_own" on public.cf_magazine_issues;
drop policy if exists "magazine_issues_delete_own" on public.cf_magazine_issues;

create policy "magazine_issues_read_entitled"
  on public.cf_magazine_issues for select to authenticated
  using (
    (select auth.uid()) = user_id
    or (
      status = 'published'
      and exists (
        select 1 from public.cf_entitlements entitlement
        where entitlement.user_id = (select auth.uid())
          and entitlement.status = 'active'
          and entitlement.plan in ('owner', 'monthly')
          and (entitlement.current_period_end is null or entitlement.current_period_end > now())
      )
    )
  );

create policy "magazine_issues_insert_publisher"
  on public.cf_magazine_issues for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.cf_entitlements entitlement
      where entitlement.user_id = (select auth.uid())
        and entitlement.plan = 'owner'
        and entitlement.status = 'active'
    )
  );

create policy "magazine_issues_update_publisher"
  on public.cf_magazine_issues for update to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.cf_entitlements entitlement
      where entitlement.user_id = (select auth.uid())
        and entitlement.plan = 'owner'
        and entitlement.status = 'active'
    )
  )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.cf_entitlements entitlement
      where entitlement.user_id = (select auth.uid())
        and entitlement.plan = 'owner'
        and entitlement.status = 'active'
    )
  );

create policy "magazine_issues_delete_publisher"
  on public.cf_magazine_issues for delete to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.cf_entitlements entitlement
      where entitlement.user_id = (select auth.uid())
        and entitlement.plan = 'owner'
        and entitlement.status = 'active'
    )
  );

drop policy if exists "magazine_articles_select_own" on public.cf_magazine_articles;
drop policy if exists "magazine_articles_insert_own" on public.cf_magazine_articles;
drop policy if exists "magazine_articles_update_own" on public.cf_magazine_articles;
drop policy if exists "magazine_articles_delete_own" on public.cf_magazine_articles;

create policy "magazine_articles_read_entitled"
  on public.cf_magazine_articles for select to authenticated
  using (
    (select auth.uid()) = user_id
    or (
      exists (
        select 1 from public.cf_entitlements entitlement
        where entitlement.user_id = (select auth.uid())
          and entitlement.status = 'active'
          and entitlement.plan in ('owner', 'monthly')
          and (entitlement.current_period_end is null or entitlement.current_period_end > now())
      )
      and exists (
        select 1 from public.cf_magazine_issues issue
        where issue.id = cf_magazine_articles.issue_id and issue.status = 'published'
      )
    )
  );

create policy "magazine_articles_insert_publisher"
  on public.cf_magazine_articles for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.cf_entitlements entitlement
      where entitlement.user_id = (select auth.uid())
        and entitlement.plan = 'owner'
        and entitlement.status = 'active'
    )
  );

create policy "magazine_articles_update_publisher"
  on public.cf_magazine_articles for update to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.cf_entitlements entitlement
      where entitlement.user_id = (select auth.uid())
        and entitlement.plan = 'owner'
        and entitlement.status = 'active'
    )
  )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.cf_entitlements entitlement
      where entitlement.user_id = (select auth.uid())
        and entitlement.plan = 'owner'
        and entitlement.status = 'active'
    )
  );

create policy "magazine_articles_delete_publisher"
  on public.cf_magazine_articles for delete to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.cf_entitlements entitlement
      where entitlement.user_id = (select auth.uid())
        and entitlement.plan = 'owner'
        and entitlement.status = 'active'
    )
  );
