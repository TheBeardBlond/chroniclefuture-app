import { requireOwnedLocation, sendApiError } from "./_lib/auth.js";

function buildGdeltUrl(location) {
  const url = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
  url.searchParams.set("query", `\"${location.city}\" ${location.state}`);
  url.searchParams.set("mode", "ArtList");
  url.searchParams.set("maxrecords", "20");
  url.searchParams.set("sort", "HybridRel");
  url.searchParams.set("format", "json");
  return url;
}

async function fetchCoverage(location) {
  const response = await fetch(buildGdeltUrl(location), {
    headers: { "User-Agent": "ChronicleFuture/1.0" },
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(`News source returned ${response.status}.`);
  const payload = await response.json();
  return Array.isArray(payload.articles) ? payload.articles : [];
}

function normalizeDate(value) {
  const text = String(value || "");
  const match = text.match(/^(\d{4})(\d{2})(\d{2})T?(\d{2})?(\d{2})?/);
  if (!match) return new Date().toISOString();
  const [, year, month, day, hour = "00", minute = "00"] = match;
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:00Z`).toISOString();
}

export default async function handler(request, response) {
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed." });

  try {
    const locationId = request.body?.location_id;
    if (!locationId) return response.status(400).json({ error: "location_id is required." });
    const { location, admin } = await requireOwnedLocation(request, locationId);
    const articles = await fetchCoverage(location);

    const { data: existing } = await admin
      .from("cf_signals")
      .select("source")
      .eq("location_id", location.id)
      .not("source", "is", null);
    const knownSources = new Set((existing || []).map((item) => item.source));

    const rows = articles
      .filter((article) => article.url && article.title && !knownSources.has(article.url))
      .slice(0, 12)
      .map((article) => ({
        location_id: location.id,
        signal_type: "local",
        title: article.title.slice(0, 500),
        summary: `Coverage from ${article.domain || "a monitored source"} concerning ${location.city}, ${location.state}.`,
        source: article.url,
        signal_date: normalizeDate(article.seendate)
      }));

    if (rows.length) {
      const { error } = await admin.from("cf_signals").insert(rows);
      if (error) throw error;
    }

    return response.status(200).json({
      success: true,
      saved_count: rows.length,
      discovered_count: articles.length
    });
  } catch (error) {
    return sendApiError(response, error, "ingest-signals");
  }
}
