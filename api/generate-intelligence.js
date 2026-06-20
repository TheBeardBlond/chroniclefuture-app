import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are not configured.");
  }
  return createClient(supabaseUrl, supabaseKey);
}

function extractJson(text) {
  if (!text || typeof text !== "string") return null;
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

async function insertFirstWorking(supabase, table, candidates) {
  let lastError = null;
  for (const payload of candidates) {
    const { data, error } = await supabase.from(table).insert(payload).select("*").single();
    if (!error) return data;
    lastError = error;
  }
  throw lastError;
}

async function generateStructuredIntelligence(location) {
  const prompt = `You are Chronicle Future, a location-first decision-support analyst.
Generate intelligence for ${location.city}, ${location.state} ${location.zip}.
Return ONLY valid JSON with this exact shape:
{
  "title": "Brief title",
  "summary": "Two sentence executive summary.",
  "signals": [
    {"scope":"local", "category":"local signals", "title":"...", "detail":"...", "score":75, "impact":"high", "confidence":"medium"},
    {"scope":"state", "category":"state signals", "title":"...", "detail":"...", "score":75, "impact":"medium", "confidence":"medium"},
    {"scope":"national", "category":"national signals", "title":"...", "detail":"...", "score":75, "impact":"medium", "confidence":"medium"},
    {"scope":"global", "category":"global signals", "title":"...", "detail":"...", "score":75, "impact":"medium", "confidence":"medium"},
    {"scope":"technology", "category":"technology watch", "title":"...", "detail":"...", "score":75, "impact":"medium", "confidence":"medium"},
    {"scope":"commodity", "category":"commodity watch", "title":"...", "detail":"...", "score":75, "impact":"medium", "confidence":"medium"}
  ],
  "opportunities": [{"title":"...", "detail":"...", "score":80, "capital_required":"low|medium|high", "time_horizon":"...", "confidence":"low|medium|high"}],
  "risks": [{"title":"...", "detail":"...", "severity":"low|medium|high", "time_horizon":"...", "mitigation":"..."}],
  "swot": {"strengths":["..."], "weaknesses":["..."], "opportunities":["..."], "threats":["..."]}
}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2600,
      response_format: { type: "json_object" }
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || "OpenAI request failed.");
  }

  const parsed = extractJson(payload?.choices?.[0]?.message?.content);
  if (!parsed) throw new Error("OpenAI returned invalid intelligence JSON.");
  return parsed;
}

async function persistIntelligence(supabase, location, intelligence) {
  const now = new Date().toISOString();
  const brief = await insertFirstWorking(supabase, "cf_briefs", [
    { location_id: location.id, title: intelligence.title, summary: intelligence.summary, content: intelligence, created_at: now },
    { location_id: location.id, title: intelligence.title, summary: intelligence.summary, report_data: intelligence, created_at: now },
    { location_id: location.id, title: intelligence.title, summary: intelligence.summary, data: intelligence, created_at: now },
    { location_id: location.id, content: intelligence, created_at: now }
  ]);

  for (const signal of intelligence.signals || []) {
    const savedSignal = await insertFirstWorking(supabase, "cf_signals", [
      { location_id: location.id, brief_id: brief.id, scope: signal.scope, category: signal.category, title: signal.title, detail: signal.detail, created_at: now },
      { location_id: location.id, cf_brief_id: brief.id, scope: signal.scope, category: signal.category, title: signal.title, description: signal.detail, created_at: now },
      { location_id: location.id, scope: signal.scope, category: signal.category, title: signal.title, detail: signal.detail, created_at: now }
    ]);

    await insertFirstWorking(supabase, "cf_signal_scores", [
      { signal_id: savedSignal.id, brief_id: brief.id, score: signal.score, impact: signal.impact, confidence: signal.confidence, created_at: now },
      { cf_signal_id: savedSignal.id, cf_brief_id: brief.id, score: signal.score, impact: signal.impact, confidence: signal.confidence, created_at: now },
      { signal_id: savedSignal.id, score: signal.score, impact: signal.impact, confidence: signal.confidence, created_at: now }
    ]);
  }

  for (const opportunity of intelligence.opportunities || []) {
    await insertFirstWorking(supabase, "cf_opportunities", [
      { location_id: location.id, brief_id: brief.id, title: opportunity.title, detail: opportunity.detail, score: opportunity.score, capital_required: opportunity.capital_required, time_horizon: opportunity.time_horizon, confidence: opportunity.confidence, created_at: now },
      { location_id: location.id, cf_brief_id: brief.id, name: opportunity.title, description: opportunity.detail, score: opportunity.score, capital_required: opportunity.capital_required, time_horizon: opportunity.time_horizon, confidence: opportunity.confidence, created_at: now },
      { location_id: location.id, title: opportunity.title, detail: opportunity.detail, score: opportunity.score, created_at: now }
    ]);
  }

  for (const risk of intelligence.risks || []) {
    await insertFirstWorking(supabase, "cf_risks", [
      { location_id: location.id, brief_id: brief.id, title: risk.title, detail: risk.detail, severity: risk.severity, time_horizon: risk.time_horizon, mitigation: risk.mitigation, created_at: now },
      { location_id: location.id, cf_brief_id: brief.id, title: risk.title, description: risk.detail, severity: risk.severity, time_horizon: risk.time_horizon, mitigation: risk.mitigation, created_at: now },
      { location_id: location.id, title: risk.title, detail: risk.detail, severity: risk.severity, created_at: now }
    ]);
  }

  await insertFirstWorking(supabase, "cf_swots", [
    { location_id: location.id, brief_id: brief.id, strengths: intelligence.swot?.strengths || [], weaknesses: intelligence.swot?.weaknesses || [], opportunities: intelligence.swot?.opportunities || [], threats: intelligence.swot?.threats || [], created_at: now },
    { location_id: location.id, cf_brief_id: brief.id, strengths: intelligence.swot?.strengths || [], weaknesses: intelligence.swot?.weaknesses || [], opportunities: intelligence.swot?.opportunities || [], threats: intelligence.swot?.threats || [], created_at: now },
    { location_id: location.id, swot: intelligence.swot || {}, created_at: now }
  ]);

  return brief;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const locationId = req.body?.location_id || req.body?.locationId;
    if (!locationId) return res.status(400).json({ error: "location_id is required" });

    const supabase = getSupabase();
    const { data: location, error: locationError } = await supabase
      .from("cf_locations")
      .select("*")
      .eq("id", locationId)
      .single();

    if (locationError) throw locationError;

    const intelligence = await generateStructuredIntelligence(location);
    const brief = await persistIntelligence(supabase, location, intelligence);

    res.status(200).json({ brief_id: brief.id });
  } catch (error) {
    console.error("generate-intelligence error:", error);
    res.status(500).json({ error: error.message || "Failed to generate intelligence" });
  }
}
