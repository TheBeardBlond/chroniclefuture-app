import { getAdminClient, requireUser, sendApiError } from "./_lib/auth.js";
import { createCheckoutSession, createStripeCustomer, OFFERS } from "./_lib/stripe.js";

export default async function handler(request, response) {
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed." });
  try {
    const user = await requireUser(request);
    const offerKey = request.body?.offer;
    if (!OFFERS[offerKey]) return response.status(400).json({ error: "Unknown billing offer." });
    const admin = getAdminClient();
    const { data: entitlement, error } = await admin
      .from("cf_entitlements")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;

    let customerId = entitlement?.stripe_customer_id;
    if (!customerId) {
      const customer = await createStripeCustomer(user);
      customerId = customer.id;
      const { error: upsertError } = await admin.from("cf_entitlements").upsert({
        user_id: user.id,
        plan: entitlement?.plan || "free",
        status: entitlement?.status || "inactive",
        stripe_customer_id: customerId,
        monthly_brief_limit: entitlement?.monthly_brief_limit || 0,
        monthly_briefs_used: entitlement?.monthly_briefs_used || 0,
        one_time_credits: entitlement?.one_time_credits || 0,
        updated_at: new Date().toISOString()
      });
      if (upsertError) throw upsertError;
    }

    const session = await createCheckoutSession({ user, customerId, offerKey });
    return response.status(200).json({ url: session.url });
  } catch (error) {
    return sendApiError(response, error, "create-checkout-session");
  }
}
