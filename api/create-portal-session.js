import { getAdminClient, requireUser, sendApiError } from "./_lib/auth.js";
import { createPortalSession } from "./_lib/stripe.js";

export default async function handler(request, response) {
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed." });
  try {
    const user = await requireUser(request);
    const admin = getAdminClient();
    const { data, error } = await admin
      .from("cf_entitlements")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();
    if (error || !data?.stripe_customer_id) {
      const missing = new Error("No billing account exists yet.");
      missing.httpStatus = 404;
      throw missing;
    }
    const session = await createPortalSession(data.stripe_customer_id);
    return response.status(200).json({ url: session.url });
  } catch (error) {
    return sendApiError(response, error, "create-portal-session");
  }
}
