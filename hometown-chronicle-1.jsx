import { useEffect, useMemo, useState } from "react";
import { supabase } from "./src/utils/supabase.js";

const SIGNAL_GROUPS = [
  "local signals",
  "state signals",
  "national signals",
  "global signals",
  "technology watch",
  "commodity watch"
];

function getBriefPayload(brief) {
  return brief?.content || brief?.report_data || brief?.data || brief?.brief || {};
}

function normalizeList(value) {
  return Array.isArray(value) ? value : [];
}

async function createLocation(form) {
  const now = new Date().toISOString();
  const payload = { city: form.city.trim(), state: form.state.trim().toUpperCase(), zip: form.zip.trim() };
  const attempts = [{ ...payload, created_at: now }, payload];

  let lastError = null;
  for (const attempt of attempts) {
    const { data, error } = await supabase.from("cf_locations").insert(attempt).select("*").single();
    if (!error) return data;
    lastError = error;
  }

  throw lastError;
}

async function loadDashboardData() {
  const [{ data: locations, error: locationsError }, { data: briefs, error: briefsError }] = await Promise.all([
    supabase.from("cf_locations").select("*").order("created_at", { ascending: false }),
    supabase.from("cf_briefs").select("*").order("created_at", { ascending: false })
  ]);

  if (locationsError) throw locationsError;
  if (briefsError) throw briefsError;

  return { locations: locations || [], briefs: briefs || [] };
}

async function selectByBrief(table, briefId, single = false) {
  const first = await supabase.from(table).select("*").eq("brief_id", briefId);
  if (!first.error) return single ? first.data?.[0] : first.data;

  const second = await supabase.from(table).select("*").eq("cf_brief_id", briefId);
  if (!second.error) return single ? second.data?.[0] : second.data;

  return single ? null : [];
}

async function loadBrief(briefId) {
  const { data: brief, error: briefError } = await supabase
    .from("cf_briefs")
    .select("*")
    .eq("id", briefId)
    .single();

  if (briefError) throw briefError;

  const [signals, signalScores, opportunities, risks, swot] = await Promise.all([
  selectByBrief("cf_signals", briefId),
  selectByBrief("cf_signal_scores", briefId),
  selectByBrief("cf_opportunities", briefId),
  selectByBrief("cf_risks", briefId),
  selectByBrief("cf_swots", briefId, true)
]);

  return {
    ...brief,
    persisted: {
      signals: signals || [],
      opportunities: opportunities || [],
      risks: risks || [],
      swot: swot || null
    }
  };
}

function LocationForm({ onCreated }) {
  const [form, setForm] = useState({ city: "", state: "", zip: "" });
  const [saving, setSaving] = useState(false);
  const valid = form.city.trim() && form.state.trim() && form.zip.trim();

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!valid) return;

    setSaving(true);
    try {
      const location = await createLocation(form);
      setForm({ city: "", state: "", zip: "" });
      onCreated(location);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="panel location-form" onSubmit={submit}>
      <div>
        <p className="eyebrow">Location-first workflow</p>
        <h2>Create a location</h2>
        <p className="muted">Locations are stored in <code>cf_locations</code> before any intelligence is generated.</p>
      </div>
      <label>City<input value={form.city} onChange={update("city")} placeholder="Bay City" /></label>
      <label>State<input value={form.state} onChange={update("state")} placeholder="MI" maxLength={2} /></label>
      <label>ZIP<input value={form.zip} onChange={update("zip")} placeholder="48708" inputMode="numeric" /></label>
      <button disabled={!valid || saving}>{saving ? "Saving location…" : "Save location"}</button>
    </form>
  );
}

function Dashboard({ onOpenBrief }) {
  const [locations, setLocations] = useState([]);
  const [briefs, setBriefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState(null);
  const [message, setMessage] = useState("");

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await loadDashboardData();
      setLocations(data.locations);
      setBriefs(data.briefs);
      setMessage("");
    } catch (error) {
      setMessage(error.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const briefsByLocation = useMemo(() => {
    return briefs.reduce((acc, brief) => {
      const locationId = brief.location_id || brief.cf_location_id;
      acc[locationId] = acc[locationId] || [];
      acc[locationId].push(brief);
      return acc;
    }, {});
  }, [briefs]);

  const generate = async (locationId) => {
    setGeneratingId(locationId);
    setMessage("");
    try {
      const response = await fetch("/api/generate-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location_id: locationId })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Generation failed.");
      await refresh();
      onOpenBrief(payload.brief_id);
    } catch (error) {
      setMessage(error.message || "Generation failed.");
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <main className="dashboard">
      <section className="hero">
        <div>
          <p className="eyebrow">Chronicle Future V2</p>
          <h1>Local future intelligence starts with a place.</h1>
          <p className="lede">Create locations, generate structured intelligence into the existing Supabase tables, and review historical briefs from <code>cf_briefs</code>.</p>
        </div>
        <LocationForm onCreated={refresh} />
      </section>

      {message && <div className="notice">{message}</div>}

      <section className="panel">
        <div className="section-head">
          <div><p className="eyebrow">Dashboard</p><h2>Locations</h2></div>
          <button className="secondary" onClick={refresh}>{loading ? "Loading…" : "Refresh"}</button>
        </div>
        <div className="location-list">
          {locations.map((location) => (
            <article className="location-card" key={location.id}>
              <div>
                <h3>{location.city}, {location.state}</h3>
                <p className="muted">ZIP {location.zip} · {briefsByLocation[location.id]?.length || 0} historical briefs</p>
              </div>
              <button onClick={() => generate(location.id)} disabled={generatingId === location.id}>
                {generatingId === location.id ? "Generating…" : "Generate brief"}
              </button>
            </article>
          ))}
          {!locations.length && !loading && <p className="muted">No locations yet. Create the first location above.</p>}
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Historical briefs</p>
        <h2>Briefs from cf_briefs</h2>
        <div className="brief-list">
          {briefs.map((brief) => {
            const payload = getBriefPayload(brief);
            return (
              <button className="brief-row" key={brief.id} onClick={() => onOpenBrief(brief.id)}>
                <span>{brief.title || payload.title || "Untitled intelligence brief"}</span>
                <small>{new Date(brief.created_at || brief.generated_at || Date.now()).toLocaleString()}</small>
              </button>
            );
          })}
          {!briefs.length && !loading && <p className="muted">Generated briefs will appear here.</p>}
        </div>
      </section>
    </main>
  );
}

function BriefPage({ briefId, onBack }) {
  const [brief, setBrief] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    loadBrief(briefId)
      .then((data) => { if (active) setBrief(data); })
      .catch((err) => { if (active) setError(err.message || "Unable to load brief."); });
    return () => { active = false; };
  }, [briefId]);

  if (error) return <div className="panel"><button className="secondary" onClick={onBack}>Back</button><p className="notice">{error}</p></div>;
  if (!brief) return <div className="panel"><p className="muted">Loading brief…</p></div>;

  const payload = getBriefPayload(brief);
  const signals = normalizeList(brief.persisted.signals).length ? brief.persisted.signals : normalizeList(payload.signals);
  const opportunities = normalizeList(brief.persisted.opportunities).length ? brief.persisted.opportunities : normalizeList(payload.opportunities);
  const risks = normalizeList(brief.persisted.risks).length ? brief.persisted.risks : normalizeList(payload.risks);
  const swot = brief.persisted.swot || payload.swot || {};

  return (
    <main className="brief-page">
      <button className="secondary" onClick={onBack}>← Dashboard</button>
      <section className="panel masthead">
        <p className="eyebrow">Rendered from cf_briefs</p>
        <h1>{brief.title || payload.title || "Intelligence Brief"}</h1>
        <p className="lede">{brief.summary || payload.summary}</p>
      </section>

      <section className="signal-grid">
        {SIGNAL_GROUPS.map((group) => {
          const items = signals.filter((signal) => (signal.category || signal.scope || "").toLowerCase().includes(group.split(" ")[0]));
          return (
            <div className="panel" key={group}>
              <p className="eyebrow">{group}</p>
              {items.map((signal) => <article className="stack-item" key={signal.id || signal.title}><h3>{signal.title}</h3><p>{signal.detail || signal.description}</p></article>)}
              {!items.length && <p className="muted">No {group} persisted for this brief.</p>}
            </div>
          );
        })}
      </section>

      <section className="two-col">
        <div className="panel">
          <p className="eyebrow">Opportunities</p>
          {opportunities.map((item) => <article className="stack-item" key={item.id || item.title || item.name}><h3>{item.title || item.name}</h3><p>{item.detail || item.description}</p><strong>{item.score ? `${item.score}/100` : item.confidence}</strong></article>)}
        </div>
        <div className="panel">
          <p className="eyebrow">Risks</p>
          {risks.map((item) => <article className="stack-item" key={item.id || item.title}><h3>{item.title}</h3><p>{item.detail || item.description}</p><strong>{item.severity}</strong></article>)}
        </div>
      </section>

      <section className="swot-grid">
        {["strengths", "weaknesses", "opportunities", "threats"].map((key) => (
          <div className="panel" key={key}>
            <p className="eyebrow">{key}</p>
            <ul>{normalizeList(swot[key]).map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        ))}
      </section>
    </main>
  );
}

export default function App() {
  const [briefId, setBriefId] = useState(null);

  return (
    <>
      <style>{`
        :root { background: #f4f1ea; color: #111827; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        body { margin: 0; background: linear-gradient(135deg, #fffaf0, #eef4ff); }
        button, input { font: inherit; }
        code { background: rgba(23, 92, 211, .08); color: #175cd3; padding: 2px 6px; border-radius: 6px; }
        .dashboard, .brief-page { max-width: 1180px; margin: 0 auto; padding: 44px 20px 80px; display: grid; gap: 24px; }
        .hero { display: grid; grid-template-columns: 1.15fr .85fr; gap: 24px; align-items: center; min-height: 520px; }
        h1 { margin: 0; font-family: Georgia, serif; font-size: clamp(44px, 7vw, 86px); line-height: .94; letter-spacing: -.055em; }
        h2, h3, p { margin-top: 0; }
        .lede { color: #475467; font-size: 20px; line-height: 1.55; }
        .muted { color: #667085; line-height: 1.55; }
        .eyebrow { color: #175cd3; font-size: 12px; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; }
        .panel { background: rgba(255,255,255,.86); border: 1px solid rgba(17,24,39,.1); border-radius: 24px; padding: 24px; box-shadow: 0 22px 70px rgba(17,24,39,.08); backdrop-filter: blur(14px); }
        .location-form { display: grid; gap: 14px; }
        label { display: grid; gap: 8px; color: #344054; font-weight: 800; }
        input { border: 1px solid #d0d5dd; border-radius: 14px; padding: 12px 14px; width: 100%; box-sizing: border-box; }
        button { border: 0; border-radius: 999px; background: #175cd3; color: white; padding: 12px 18px; font-weight: 900; cursor: pointer; }
        button:disabled { background: #98a2b3; cursor: not-allowed; }
        .secondary { background: #111827; }
        .notice { color: #b42318; font-weight: 800; }
        .section-head, .location-card { display: flex; justify-content: space-between; gap: 16px; align-items: center; }
        .location-list, .brief-list { display: grid; gap: 12px; }
        .location-card { padding: 16px 0; border-top: 1px solid #eaecf0; }
        .brief-row { width: 100%; background: #fff; color: #111827; border: 1px solid #eaecf0; border-radius: 16px; display: flex; justify-content: space-between; gap: 14px; text-align: left; }
        .masthead { padding: 34px; }
        .signal-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .swot-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
        .stack-item { border-top: 1px solid #eaecf0; padding-top: 14px; margin-top: 14px; }
        .stack-item p, li { color: #475467; line-height: 1.55; }
        @media (max-width: 900px) { .hero, .signal-grid, .two-col, .swot-grid { grid-template-columns: 1fr; } .location-card, .brief-row, .section-head { display: grid; } }
      `}</style>
      {briefId ? <BriefPage briefId={briefId} onBack={() => setBriefId(null)} /> : <Dashboard onOpenBrief={setBriefId} />}
    </>
  );
}
