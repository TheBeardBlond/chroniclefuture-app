import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) throw new Error("Supabase environment variables are not configured.");
  return createClient(supabaseUrl, supabaseKey);
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

async function selectByBrief(supabase, table, briefId, single = false) {
  const first = await supabase.from(table).select("*").eq("brief_id", briefId);
  if (!first.error) return single ? first.data?.[0] : first.data || [];

  const second = await supabase.from(table).select("*").eq("cf_brief_id", briefId);
  if (!second.error) return single ? second.data?.[0] : second.data || [];

  return single ? null : [];
}

function briefPayload(brief) {
  return brief?.content || brief?.report_data || brief?.data || brief?.brief || {};
}

async function loadStrategistContext(supabase, locationId) {
  let { data: briefs, error: briefError } = await supabase
    .from("cf_briefs")
    .select("*")
    .eq("location_id", locationId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (briefError) {
    const fallback = await supabase
      .from("cf_briefs")
      .select("*")
      .eq("cf_location_id", locationId)
      .order("created_at", { ascending: false })
      .limit(1);
    briefs = fallback.data;
    briefError = fallback.error;
  }

  if (briefError) throw briefError;
  const brief = briefs?.[0];
  if (!brief) throw new Error("Generate an intelligence brief before starting the Daily Strategist.");

  const [signals, signalScores, opportunities, risks, swot] = await Promise.all([
    selectByBrief(supabase, "cf_signals", brief.id),
    selectByBrief(supabase, "cf_signal_scores", brief.id),
    selectByBrief(supabase, "cf_opportunities", brief.id),
    selectByBrief(supabase, "cf_risks", brief.id),
    selectByBrief(supabase, "cf_swots", brief.id, true)
  ]);

  const scoresBySignal = (signalScores || []).reduce((acc, score) => {
    acc[score.signal_id || score.cf_signal_id] = score;
    return acc;
  }, {});

  const topSignals = (signals || [])
    .map((signal) => ({ ...signal, score_record: scoresBySignal[signal.id] }))
    .sort((a, b) => Number(b.score_record?.score || b.score || 0) - Number(a.score_record?.score || a.score || 0))
    .slice(0, 8);

  return {
    brief: {
      id: brief.id,
      title: brief.title || briefPayload(brief).title,
      summary: brief.summary || briefPayload(brief).summary,
      created_at: brief.created_at || brief.generated_at
    },
    top_scored_signals: topSignals,
    opportunities: opportunities || [],
    risks: risks || [],
    swot: swot || briefPayload(brief).swot || null
  };
}

async function ensureSession(supabase, { sessionId, locationId, message }) {
  if (sessionId) return { id: sessionId };

  const now = new Date().toISOString();
  const title = String(message || "Daily Strategist").slice(0, 80);
  return insertFirstWorking(supabase, "cf_chat_sessions", [
    { location_id: locationId, title, created_at: now, updated_at: now },
    { cf_location_id: locationId, title, created_at: now, updated_at: now },
    { location_id: locationId, created_at: now }
  ]);
}

async function storeMessage(supabase, sessionId, role, content) {
  const now = new Date().toISOString();
  return insertFirstWorking(supabase, "cf_chat_messages", [
    { session_id: sessionId, role, content, created_at: now },
    { cf_chat_session_id: sessionId, role, content, created_at: now },
    { session_id: sessionId, sender: role, message: content, created_at: now }
  ]);
}

async function answerStrategistQuestion(context, question) {
  const prompt = `You are the Chronicle Future Daily Strategist.
Answer the user's question using the Chronicle Future intelligence context below whenever possible.
If the context does not support a claim, say what is missing and frame it as a hypothesis, not a fact.
Be practical for entrepreneurs, operators, and investors. Recommend actions, tradeoffs, risks, and next checks.

CHRONICLE FUTURE CONTEXT:
${JSON.stringify(context)}

USER QUESTION:
${question}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 900
    })
  });

  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message || "Strategist model request failed.");
  return payload?.choices?.[0]?.message?.content || "I could not generate a strategist response.";
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const locationId = req.body?.location_id || req.body?.locationId;
    const question = String(req.body?.message || "").trim();
    if (!locationId) return res.status(400).json({ error: "location_id is required" });
    if (!question) return res.status(400).json({ error: "message is required" });

    const supabase = getSupabase();
    const context = await loadStrategistContext(supabase, locationId);
    const session = await ensureSession(supabase, { sessionId: req.body?.session_id || req.body?.sessionId, locationId, message: question });

    await storeMessage(supabase, session.id, "user", question);
    const answer = await answerStrategistQuestion(context, question);
    await storeMessage(supabase, session.id, "assistant", answer);

    res.status(200).json({ session_id: session.id, answer, context_summary: { brief_id: context.brief.id, signal_count: context.top_scored_signals.length } });
  } catch (error) {
    console.error("strategist-chat error:", error);
    res.status(500).json({ error: error.message || "Daily Strategist failed" });
  }
}
