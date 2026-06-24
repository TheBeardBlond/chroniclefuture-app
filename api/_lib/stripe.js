const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
export const APP_URL = process.env.APP_URL || "https://chroniclefuture.com";

export const OFFERS = {
  monthly: { mode: "subscription", amount: 3900, name: "Chronicle Future Monthly", briefs: 4, priceId: process.env.STRIPE_MONTHLY_PRICE_ID },
  one_time: { mode: "payment", amount: 1900, name: "Chronicle Future One-Time Brief", briefs: 1, priceId: process.env.STRIPE_ONE_TIME_PRICE_ID }
};

export function requireStripeKey() {
  if (!stripeSecretKey) {
    const error = new Error("Payments are being configured. Please try again shortly.");
    error.httpStatus = 503;
    throw error;
  }
  return stripeSecretKey;
}

export async function stripeRequest(path, parameters) {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requireStripeKey()}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: parameters
  });
  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(payload?.error?.message || "Stripe request failed.");
    error.httpStatus = 502;
    throw error;
  }
  return payload;
}

export async function createStripeCustomer(user) {
  const parameters = new URLSearchParams();
  parameters.set("email", user.email || "");
  parameters.set("metadata[user_id]", user.id);
  parameters.set("description", "Chronicle Future customer");
  return stripeRequest("customers", parameters);
}

export async function createCheckoutSession({ user, customerId, offerKey }) {
  const offer = OFFERS[offerKey];
  if (!offer) {
    const error = new Error("Unknown billing offer.");
    error.httpStatus = 400;
    throw error;
  }

  const parameters = new URLSearchParams();
  parameters.set("mode", offer.mode);
  parameters.set("customer", customerId);
  parameters.set("client_reference_id", user.id);
  parameters.set("success_url", `${APP_URL}/?checkout=success`);
  parameters.set("cancel_url", `${APP_URL}/?checkout=cancelled`);
  parameters.set("line_items[0][quantity]", "1");
  if (offer.priceId) {
    parameters.set("line_items[0][price]", offer.priceId);
  } else {
    parameters.set("line_items[0][price_data][currency]", "usd");
    parameters.set("line_items[0][price_data][unit_amount]", String(offer.amount));
    parameters.set("line_items[0][price_data][product_data][name]", offer.name);
  }
  parameters.set("metadata[user_id]", user.id);
  parameters.set("metadata[plan]", offerKey);
  if (offer.mode === "subscription" && !offer.priceId) {
    parameters.set("line_items[0][price_data][recurring][interval]", "month");
  }
  if (offer.mode === "subscription") {
    parameters.set("subscription_data[metadata][user_id]", user.id);
    parameters.set("subscription_data[metadata][plan]", offerKey);
  }
  return stripeRequest("checkout/sessions", parameters);
}

export async function createPortalSession(customerId) {
  const parameters = new URLSearchParams();
  parameters.set("customer", customerId);
  parameters.set("return_url", `${APP_URL}/`);
  return stripeRequest("billing_portal/sessions", parameters);
}
