import crypto from "node:crypto";
import { getAdminClient } from "./_lib/auth.js";

export const config = { api: { bodyParser: false } };

async function readRawBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function verifyStripeSignature(payload, header) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !header) return false;
  const values = Object.fromEntries(header.split(",").map((part) => part.split("=")));
  if (!values.t || !values.v1) return false;
  if (Math.abs(Date.now() / 1000 - Number(values.t)) > 300) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${values.t}.${payload.toString("utf8")}`).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(values.v1);
  return expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

async function grantCheckout(admin, session) {
  const userId = session.metadata?.user_id || session.client_reference_id;
  const plan = session.metadata?.plan;
  if (!userId || !plan) throw new Error("Checkout metadata is incomplete.");
  const { data: current, error } = await admin.from("cf_entitlements").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;

  if (plan === "monthly") {
    const { error: upsertError } = await admin.from("cf_entitlements").upsert({
      user_id: userId,
      plan: "monthly",
      status: "active",
      stripe_customer_id: String(session.customer),
      stripe_subscription_id: String(session.subscription),
      monthly_brief_limit: 4,
      monthly_briefs_used: 0,
      usage_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 32 * 86400000).toISOString(),
      one_time_credits: current?.one_time_credits || 0,
      updated_at: new Date().toISOString()
    });
    if (upsertError) throw upsertError;
  } else if (plan === "one_time") {
    const { error: upsertError } = await admin.from("cf_entitlements").upsert({
      user_id: userId,
      plan: current?.plan || "one_time",
      status: current?.status || "active",
      stripe_customer_id: String(session.customer),
      monthly_brief_limit: current?.monthly_brief_limit || 0,
      monthly_briefs_used: current?.monthly_briefs_used || 0,
      one_time_credits: (current?.one_time_credits || 0) + 1,
      updated_at: new Date().toISOString()
    });
    if (upsertError) throw upsertError;
  }
}

async function updateSubscription(admin, subscription) {
  let userId = subscription.metadata?.user_id;
  if (!userId) {
    const { data } = await admin.from("cf_entitlements").select("user_id").eq("stripe_subscription_id", subscription.id).maybeSingle();
    userId = data?.user_id;
  }
  if (!userId) return;
  const active = ["active", "trialing"].includes(subscription.status);
  const { error } = await admin.from("cf_entitlements").update({
    plan: "monthly",
    status: active ? "active" : subscription.status,
    stripe_customer_id: String(subscription.customer),
    stripe_subscription_id: subscription.id,
    monthly_brief_limit: active ? 4 : 0,
    current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
    updated_at: new Date().toISOString()
  }).eq("user_id", userId);
  if (error) throw error;
}

async function updateInvoiceStatus(admin, invoice, paid) {
  const subscriptionId = invoice.subscription || invoice.parent?.subscription_details?.subscription;
  if (!subscriptionId) return;
  const { data: entitlement, error } = await admin
    .from("cf_entitlements")
    .select("user_id")
    .eq("stripe_subscription_id", String(subscriptionId))
    .maybeSingle();
  if (error || !entitlement) return;
  const linePeriodEnd = invoice.lines?.data?.[0]?.period?.end;
  const updates = paid
    ? {
        status: "active",
        monthly_briefs_used: 0,
        usage_period_start: new Date().toISOString(),
        current_period_end: linePeriodEnd ? new Date(linePeriodEnd * 1000).toISOString() : null,
        updated_at: new Date().toISOString()
      }
    : { status: "past_due", updated_at: new Date().toISOString() };
  const { error: updateError } = await admin.from("cf_entitlements").update(updates).eq("user_id", entitlement.user_id);
  if (updateError) throw updateError;
}

export default async function handler(request, response) {
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed." });
  const rawBody = await readRawBody(request);
  if (!verifyStripeSignature(rawBody, request.headers["stripe-signature"])) {
    return response.status(400).json({ error: "Invalid Stripe signature." });
  }

  const event = JSON.parse(rawBody.toString("utf8"));
  const admin = getAdminClient();
  const object = event.data?.object || {};
  const userId = object.metadata?.user_id || object.client_reference_id || null;
  const { error: recordError } = await admin.from("cf_billing_events").insert({
    stripe_event_id: event.id,
    user_id: userId,
    event_type: event.type,
    checkout_session_id: object.object === "checkout.session" ? object.id : null,
    amount_total: object.amount_total ?? object.amount_paid ?? null,
    currency: object.currency || null
  });
  if (recordError?.code === "23505") return response.status(200).json({ received: true, duplicate: true });
  if (recordError) return response.status(500).json({ error: recordError.message });

  try {
    if (event.type === "checkout.session.completed" && object.payment_status === "paid") await grantCheckout(admin, object);
    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") await updateSubscription(admin, object);
    if (event.type === "invoice.paid" || event.type === "invoice.payment_succeeded") await updateInvoiceStatus(admin, object, true);
    if (event.type === "invoice.payment_failed") await updateInvoiceStatus(admin, object, false);
    return response.status(200).json({ received: true });
  } catch (error) {
    await admin.from("cf_billing_events").delete().eq("stripe_event_id", event.id);
    console.error("stripe-webhook:", error);
    return response.status(500).json({ error: "Webhook processing failed." });
  }
}
