import { getAdminClient } from "./_lib/auth.js";

export default async function handler(request, response) {
  if (request.method !== "GET") return response.status(405).json({ error: "Method not allowed." });

  const checks = {
    supabase: false,
    openai: Boolean(process.env.OPENAI_API_KEY),
    stripe: Boolean(process.env.STRIPE_SECRET_KEY),
    stripeWebhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET)
  };

  try {
    const admin = getAdminClient();
    const { error } = await admin.from("cf_locations").select("id").limit(1);
    checks.supabase = !error;
  } catch (error) {
    console.error("health check:", error);
  }

  const healthy = Object.values(checks).every(Boolean);
  return response.status(healthy ? 200 : 503).json({
    status: healthy ? "healthy" : "degraded",
    checks
  });
}
