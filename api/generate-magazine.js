import { getAdminClient, requireUser, sendApiError } from "./_lib/auth.js";

const MAGAZINE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    subtitle: { type: "string" },
    dek: { type: "string" },
    editor_note: { type: "string" },
    articles: {
      type: "array",
      minItems: 4,
      maxItems: 4,
      items: {
        type: "object",
        properties: {
          section: { type: "string" },
          headline: { type: "string" },
          subheadline: { type: "string" },
          body: { type: "string" },
          pull_quote: { type: "string" },
          source_note: { type: "string" }
        },
        required: ["section", "headline", "subheadline", "body", "pull_quote", "source_note"],
        additionalProperties: false
      }
    }
  },
  required: ["title", "subtitle", "dek", "editor_note", "articles"],
  additionalProperties: false
};

function compactEvidence(brief, signals, opportunities, risks, swot) {
  return JSON.stringify({
    brief: {
      title: brief.title,
      summary: brief.summary,
      local_signals: brief.local_signals,
      state_signals: brief.state_signals,
      national_signals: brief.national_signals,
      global_signals: brief.global_signals,
      technology_watch: brief.technology_watch,
      commodity_watch: brief.commodity_watch,
      decade_outlook: brief.decade_outlook
    },
    signals: signals.map(({ signal_type, title, summary, source, signal_date }) => ({ signal_type, title, summary, source, signal_date })),
    opportunities: opportunities.map(({ title, description, opportunity_score, confidence_level, capital_requirement, time_horizon }) => ({ title, description, opportunity_score, confidence_level, capital_requirement, time_horizon })),
    risks: risks.map(({ title, description, risk_score, confidence_level, severity, time_horizon, mitigation }) => ({ title, description, risk_score, confidence_level, severity, time_horizon, mitigation })),
    swot: swot ? { strengths: swot.strengths, weaknesses: swot.weaknesses, opportunities: swot.opportunities, threats: swot.threats } : {}
  });
}

async function generateIssue(location, evidence) {
  if (!process.env.ANTHROPIC_API_KEY) {
    const error = new Error("Claude magazine production is not configured yet.");
    error.httpStatus = 503;
    throw error;
  }

  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
  const prompt = `Create a concise four-article business intelligence magazine issue for ${location.city}, ${location.state} ${location.zip}.

Use only the supplied Chronicle Future evidence. Never invent events, people, quotations, statistics, sources, or dates. Clearly distinguish sourced facts from analysis. The reader is a business operator deciding what to monitor and do next.

Editorial requirements:
- Give the issue a credible magazine title, subtitle, and one-sentence dek.
- Write a short editor note explaining the edition's central theme.
- Produce exactly four articles: Lead Analysis, Opportunity Desk, Risk Monitor, and Long View.
- Each body should be 350-550 words, use short paragraphs, and end with a practical implication.
- Pull quotes must be exact excerpts from the generated article, not attributed to a person.
- Source notes must name only sources present in the evidence or say "Chronicle Future synthesis".

CHRONICLE FUTURE EVIDENCE:
${evidence}`;

  const apiResponse = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model,
      max_tokens: 7000,
      temperature: 0.35,
      system: "You are the senior editor of Chronicle Future. Produce restrained, evidence-led business journalism. Do not add facts that are absent from the provided evidence.",
      messages: [{ role: "user", content: prompt }],
      output_config: { format: { type: "json_schema", schema: MAGAZINE_SCHEMA } }
    }),
    signal: AbortSignal.timeout(110000)
  });

  const payload = await apiResponse.json();
  if (!apiResponse.ok) throw new Error(payload?.error?.message || "Claude magazine generation failed.");
  if (payload.stop_reason === "max_tokens") throw new Error("Claude reached the magazine output limit. Try again.");
  const text = payload.content?.find((block) => block.type === "text")?.text;
  if (!text) throw new Error("Claude returned no magazine content.");
  let magazine;
  try { magazine = JSON.parse(text); } catch { throw new Error("Claude returned an invalid magazine draft."); }
  if (!Array.isArray(magazine.articles) || magazine.articles.length !== 4) throw new Error("Claude did not return four magazine articles.");
  return { magazine, model, usage: payload.usage || {} };
}

export default async function handler(request, response) {
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed." });
  try {
    const briefId = request.body?.brief_id;
    if (!briefId) return response.status(400).json({ error: "brief_id is required." });
    const user = await requireUser(request);
    const admin = getAdminClient();

    const { data: entitlement, error: entitlementError } = await admin
      .from("cf_entitlements")
      .select("plan,status,current_period_end")
      .eq("user_id", user.id)
      .maybeSingle();
    if (entitlementError) throw entitlementError;
    const magazineAccess = entitlement?.plan === "owner"
      || (entitlement?.plan === "monthly" && entitlement?.status === "active" && (!entitlement.current_period_end || new Date(entitlement.current_period_end) > new Date()));
    if (!magazineAccess) {
      const error = new Error("Magazine production requires active monthly access.");
      error.httpStatus = 402;
      throw error;
    }

    const { data: brief, error: briefError } = await admin.from("cf_briefs").select("*").eq("id", briefId).single();
    if (briefError || !brief) {
      const error = new Error("Source brief not found.");
      error.httpStatus = 404;
      throw error;
    }
    if (brief.user_id !== user.id) {
      const error = new Error("You do not have access to this brief.");
      error.httpStatus = 403;
      throw error;
    }

    const [locationResult, signalsResult, opportunitiesResult, risksResult, swotResult] = await Promise.all([
      admin.from("cf_locations").select("*").eq("id", brief.location_id).single(),
      admin.from("cf_signals").select("*").eq("brief_id", brief.id).order("signal_date", { ascending: false }),
      admin.from("cf_opportunities").select("*").eq("brief_id", brief.id).order("opportunity_score", { ascending: false }),
      admin.from("cf_risks").select("*").eq("brief_id", brief.id).order("risk_score", { ascending: false }),
      admin.from("cf_swots").select("*").eq("brief_id", brief.id).maybeSingle()
    ]);
    const readError = [locationResult, signalsResult, opportunitiesResult, risksResult, swotResult].find((result) => result.error)?.error;
    if (readError) throw readError;

    const evidence = compactEvidence(brief, signalsResult.data || [], opportunitiesResult.data || [], risksResult.data || [], swotResult.data);
    const { magazine, model, usage } = await generateIssue(locationResult.data, evidence);
    const { data: issue, error: issueError } = await admin.from("cf_magazine_issues").insert({
      user_id: user.id,
      location_id: brief.location_id,
      source_brief_id: brief.id,
      title: magazine.title,
      subtitle: magazine.subtitle,
      dek: magazine.dek,
      editor_note: magazine.editor_note,
      generation_model: model,
      input_tokens: usage.input_tokens || 0,
      output_tokens: usage.output_tokens || 0
    }).select("*").single();
    if (issueError) throw issueError;

    const articleRows = magazine.articles.map((article, index) => ({
      issue_id: issue.id,
      user_id: user.id,
      sort_order: index,
      section: article.section,
      headline: article.headline,
      subheadline: article.subheadline,
      body: article.body,
      pull_quote: article.pull_quote,
      source_note: article.source_note
    }));
    const { error: articleError } = await admin.from("cf_magazine_articles").insert(articleRows);
    if (articleError) {
      await admin.from("cf_magazine_issues").delete().eq("id", issue.id);
      throw articleError;
    }

    return response.status(200).json({ success: true, issue_id: issue.id });
  } catch (error) {
    return sendApiError(response, error, "generate-magazine");
  }
}
