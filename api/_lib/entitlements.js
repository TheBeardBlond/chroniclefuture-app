function paymentRequired(message) {
  const error = new Error(message);
  error.httpStatus = 402;
  return error;
}

export async function getEntitlement(admin, userId) {
  const { data, error } = await admin
    .from("cf_entitlements")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function assertBriefAccess(admin, userId) {
  const entitlement = await getEntitlement(admin, userId);
  if (!entitlement) throw paymentRequired("Choose a monthly plan or purchase a one-time brief to continue.");
  if (entitlement.plan === "owner" && entitlement.status === "active") return entitlement;
  if (
    entitlement.plan === "monthly"
    && entitlement.status === "active"
    && (!entitlement.current_period_end || new Date(entitlement.current_period_end) > new Date())
    && entitlement.monthly_briefs_used < entitlement.monthly_brief_limit
  ) return entitlement;
  if (entitlement.one_time_credits > 0) return entitlement;
  throw paymentRequired("Your brief allowance is used. Renew monthly access or purchase another one-time brief.");
}

export async function consumeBriefAccess(admin, entitlement) {
  if (entitlement.plan === "owner" && entitlement.status === "active") return "owner";
  if (
    entitlement.plan === "monthly"
    && entitlement.status === "active"
    && entitlement.monthly_briefs_used < entitlement.monthly_brief_limit
  ) {
    const { data, error } = await admin
      .from("cf_entitlements")
      .update({ monthly_briefs_used: entitlement.monthly_briefs_used + 1, updated_at: new Date().toISOString() })
      .eq("user_id", entitlement.user_id)
      .eq("monthly_briefs_used", entitlement.monthly_briefs_used)
      .select("user_id")
      .maybeSingle();
    if (error) throw error;
    if (data) return "monthly";
  }
  if (entitlement.one_time_credits > 0) {
    const { data, error } = await admin
      .from("cf_entitlements")
      .update({ one_time_credits: entitlement.one_time_credits - 1, updated_at: new Date().toISOString() })
      .eq("user_id", entitlement.user_id)
      .eq("one_time_credits", entitlement.one_time_credits)
      .select("user_id")
      .maybeSingle();
    if (error) throw error;
    if (data) return "one_time";
  }
  throw paymentRequired("This brief allowance was already used. Refresh your account and try again.");
}
