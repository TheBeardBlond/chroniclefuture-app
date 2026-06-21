import { requireOwnedLocation, sendApiError } from "./_lib/auth.js";
import { assertBriefAccess, consumeBriefAccess } from "./_lib/entitlements.js";

function extractJson(text) {
  const cleaned = String(text || "").replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(cleaned); } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { return null; }
  }
}

function score(value, fallback = 60) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.min(100, Math.round(numeric))) : fallback;
}

function groupText(signals, scope) {
  return signals
    .filter((signal) => signal.scope === scope)
    .map((signal) => `${signal.title}: ${signal.detail}`)
    .join("\n\n");
}

async function generateIntelligence(location, sourceSignals) {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured.");
  const evidence = sourceSignals.length
    ? sourceSignals.map((signal, index) => `${index + 1}. ${signal.title} — ${signal.summary || "No summary"} (${signal.source || "source unavailable"})`).join("\n")
    : "No recent sourced signals are available. Clearly distinguish structural analysis from current evidence.";

  const prompt = `You are Chronicle Future, a disciplined location intelligence analyst.
Analyze ${location.city}, ${location.state} ${location.zip} using the supplied evidence and durable geographic, economic, infrastructure, demographic, technology, energy, and resource factors.

SOURCE EVIDENCE:
${evidence}

Return only valid JSON with this shape:
{
  "title":"...",
  "summary":"Two concise sentences.",
  "decade_outlook":"A concise 5-10 year structural outlook.",
  "signals":[{"scope":"local|state|national|global|technology|commodity","title":"...","detail":"...","impact_score":0,"confidence_score":0,"urgency_score":0}],
  "opportunities":[{"title":"...","description":"...","opportunity_score":0,"confidence_level":0,"capital_requirement":"low|medium|high","time_horizon":"..."}],
  "risks":[{"title":"...","description":"...","risk_score":0,"confidence_level":0,"severity":"low|medium|high","time_horizon":"...","mitigation":"..."}],
  "swot":{"strengths":["..."],"weaknesses":["..."],"opportunities":["..."],"threats":["..."]}
}
Include at least one signal for every scope and 3-5 opportunities and risks. Never invent a named event or statistic not present in the evidence.`;

  const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 3000,
      response_format: { type: "json_object" }
    }),
    signal: AbortSignal.timeout(55000)
  });
  const payload = await openaiResponse.json();
  if (!openaiResponse.ok) throw new Error(payload?.error?.message || "Intelligence generation failed.");
  const intelligence = extractJson(payload?.choices?.[0]?.message?.content);
  if (!intelligence) throw new Error("The intelligence response was not valid JSON.");
  return intelligence;
}

async function persistIntelligence(admin, user, location, intelligence) {
  const signals = Array.isArray(intelligence.signals) ? intelligence.signals : [];
  const { data: brief, error: briefError } = await admin.from("cf_briefs").insert({
    location_id: location.id,
    user_id: user.id,
    week_of: new Date().toISOString().slice(0, 10),
    title: intelligence.title || `${location.city} intelligence brief`,
    summary: intelligence.summary || "",
    content: intelligence,
    local_signals: groupText(signals, "local"),
    state_signals: groupText(signals, "state"),
    national_signals: groupText(signals, "national"),
    global_signals: groupText(signals, "global"),
    technology_watch: groupText(signals, "technology"),
    commodity_watch: groupText(signals, "commodity"),
    decade_outlook: intelligence.decade_outlook || ""
  }).select("*").single();
  if (briefError) throw briefError;

  for (const signal of signals) {
    const { data: savedSignal, error } = await admin.from("cf_signals").insert({
      location_id: location.id,
      brief_id: brief.id,
      signal_type: signal.scope || "local",
      title: signal.title,
      summary: signal.detail,
      source: "Chronicle Future synthesis",
      signal_date: new Date().toISOString()
    }).select("id").single();
    if (error) throw error;
    const { error: scoreError } = await admin.from("cf_signal_scores").insert({
      signal_id: savedSignal.id,
      brief_id: brief.id,
      impact_score: score(signal.impact_score),
      confidence_score: score(signal.confidence_score),
      urgency_score: score(signal.urgency_score)
    });
    if (scoreError) throw scoreError;
  }

  const opportunities = (Array.isArray(intelligence.opportunities) ? intelligence.opportunities : []).map((item) => ({
    location_id: location.id,
    brief_id: brief.id,
    title: item.title,
    description: item.description,
    opportunity_score: score(item.opportunity_score),
    confidence_level: score(item.confidence_level),
    capital_requirement: item.capital_requirement,
    time_horizon: item.time_horizon
  }));
  if (opportunities.length) {
    const { error } = await admin.from("cf_opportunities").insert(opportunities);
    if (error) throw error;
  }

  const risks = (Array.isArray(intelligence.risks) ? intelligence.risks : []).map((item) => ({
    location_id: location.id,
    brief_id: brief.id,
    title: item.title,
    description: item.description,
    risk_score: score(item.risk_score),
    confidence_level: score(item.confidence_level),
    severity: item.severity,
    time_horizon: item.time_horizon,
    mitigation: item.mitigation
  }));
  if (risks.length) {
    const { error } = await admin.from("cf_risks").insert(risks);
    if (error) throw error;
  }

  const swot = intelligence.swot || {};
  const { error: swotError } = await admin.from("cf_swots").insert({
    location_id: location.id,
    brief_id: brief.id,
    strengths: Array.isArray(swot.strengths) ? swot.strengths : [],
    weaknesses: Array.isArray(swot.weaknesses) ? swot.weaknesses : [],
    opportunities: Array.isArray(swot.opportunities) ? swot.opportunities : [],
    threats: Array.isArray(swot.threats) ? swot.threats : []
  });
  if (swotError) throw swotError;
  return brief;
}

export default async function handler(request, response) {
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed." });
  try {
    const locationId = request.body?.location_id;
    if (!locationId) return response.status(400).json({ error: "location_id is required." });
    const { user, location, admin } = await requireOwnedLocation(request, locationId);
    const entitlement = await assertBriefAccess(admin, user.id);
    const { data: sourceSignals, error } = await admin
      .from("cf_signals")
      .select("title,summary,source,signal_date")
      .eq("location_id", location.id)
      .is("brief_id", null)
      .order("signal_date", { ascending: false })
      .limit(20);
    if (error) throw error;
    const intelligence = await generateIntelligence(location, sourceSignals || []);
    const brief = await persistIntelligence(admin, user, location, intelligence);
    try {
      await consumeBriefAccess(admin, entitlement);
    } catch (entitlementError) {
      await admin.from("cf_briefs").delete().eq("id", brief.id);
      throw entitlementError;
    }
    return response.status(200).json({ success: true, brief_id: brief.id });
  } catch (error) {
    return sendApiError(response, error, "generate-intelligence");
  }
}
