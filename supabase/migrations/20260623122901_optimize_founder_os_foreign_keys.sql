create index if not exists cf_business_plans_business_user_idx
  on public.cf_business_plans(business_id, user_id);

create index if not exists cf_financial_models_business_user_idx
  on public.cf_financial_models(business_id, user_id);

create index if not exists cf_execution_items_business_user_idx
  on public.cf_execution_items(business_id, user_id);
