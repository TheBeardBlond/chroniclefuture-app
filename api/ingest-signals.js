import { createClient } from "@supabase/supabase-js";
import { flattenSignalSet, ingestSignals } from "../src/services/signalIngestion.js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) throw new Error("Supabase environment variables are not configured.");
  return createClient(supabaseUrl, supabaseKey);
}

async function insertSignal(supabase, location, item) {
  const now = new Date().toISOString();
  const attempts = [
    {
      location_id: location.id,
      scope: item.scope,
      category: item.category,
      source: item.source,
      title: item.title,
      detail: item.detail,
      metric: item.metric,
      value: item.value,
      unit: item.unit,
      observed_at: item.observed_at,
      geography: item.geography,
      created_at: now
    },
    {
      location_id: location.id,
      scope: item.scope,
      category: item.category,
      source: item.source,
      title: item.title,
      description: item.detail,
      metric: item.metric,
      value: item.value,
      unit: item.unit,
      observed_at: item.observed_at,
      geography: item.geography,
      created_at: now
    },
    {
      location_id: location.id,
      category: item.category,
      title: item.title,
      detail: item.detail,
      source: item.source,
      created_at: now
    },
    {
      location_id: location.id,
      title: item.title,
      detail: item.detail,
      created_at: now
    }
  ];

  let lastError = null;
  for (const payload of attempts) {
    const { data, error } = await supabase.from("cf_signals").insert(payload).select("*").single();
    if (!error) return data;
    lastError = error;
  }
  throw lastError;
}

async function resolveLocation(supabase, body) {
  if (body.location_id || body.locationId) {
    const { data, error } = await supabase
      .from("cf_locations")
      .select("*")
      .eq("id", body.location_id || body.locationId)
      .single();
    if (error) throw error;
    return data;
  }

  const { city, state, zip } = body;
  if (!city || !state || !zip) throw new Error("Provide location_id or city, state, and zip.");
  return { city, state, zip };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const supabase = getSupabase();
    const location = await resolveLocation(supabase, req.body || {});
    const signalSet = await ingestSignals(location);
    const flatSignals = flattenSignalSet(signalSet);

    const savedSignals = location.id
      ? await Promise.all(flatSignals.map((item) => insertSignal(supabase, location, item)))
      : [];

    res.status(200).json({ ...signalSet, saved_count: savedSignals.length });
  } catch (error) {
    console.error("ingest-signals error:", error);
    res.status(500).json({ error: error.message || "Signal ingestion failed" });
  }
}
