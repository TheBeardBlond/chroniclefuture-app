import { useEffect, useMemo, useState } from "react";
import { supabase } from "./src/utils/supabase.js";

const PUBLIC_SIGNALS = [
  { scope: "Global economy", region: "Worldwide", title: "Capital is repricing around slower growth and higher uncertainty", summary: "Operators are balancing tighter financing conditions against uneven demand, making cash discipline and flexible investment timing more valuable.", impact: 88, horizon: "0-18 months" },
  { scope: "Technology", region: "North America / Asia", title: "AI infrastructure is becoming an energy and industrial story", summary: "Compute expansion is pushing demand beyond chips and software into power generation, grid equipment, cooling, construction, and specialized labor.", impact: 94, horizon: "1-5 years" },
  { scope: "Energy", region: "Worldwide", title: "Grid capacity is emerging as a constraint on digital expansion", summary: "Power availability, interconnection queues, and equipment lead times increasingly shape where energy-intensive projects can operate.", impact: 91, horizon: "2-7 years" },
  { scope: "Trade", region: "Global corridors", title: "Supply chains continue to favor resilience over pure efficiency", summary: "Companies are diversifying suppliers, holding more strategic inventory, and placing greater value on reliable transport and regional production capacity.", impact: 83, horizon: "1-4 years" },
  { scope: "Resources", region: "Americas / Indo-Pacific", title: "Critical minerals are moving closer to national strategy", summary: "Permitting, processing capacity, recycling, and secure access to industrial inputs are becoming competitive advantages for regions and firms.", impact: 86, horizon: "3-10 years" },
  { scope: "Demographics", region: "Advanced economies", title: "Aging populations are reshaping labor and essential services", summary: "Healthcare, housing, mobility, automation, and workforce availability will be influenced by a growing share of older residents.", impact: 89, horizon: "5-15 years" }
];

const SIGNAL_GROUPS = ["Local", "State", "National", "Global", "Technology", "Commodity"];
const AUTH_REDIRECT_URL = "https://chroniclefuture-app.vercel.app";

const displayDate = (value) => new Date(value || Date.now()).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

async function loadDashboardData(userId) {
  const [{ data: locations, error: locationError }, { data: briefs, error: briefError }] = await Promise.all([
    supabase.from("cf_locations").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("cf_briefs").select("*").eq("user_id", userId).order("created_at", { ascending: false })
  ]);
  if (locationError) throw locationError;
  if (briefError) throw briefError;
  return { locations: locations || [], briefs: briefs || [] };
}

async function createLocation(form, userId) {
  const payload = { city: form.city.trim(), state: form.state.trim().toUpperCase(), zip: form.zip.trim(), user_id: userId };
  const { data, error } = await supabase.from("cf_locations").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

async function loadBrief(briefId) {
  const { data: brief, error } = await supabase.from("cf_briefs").select("*").eq("id", briefId).single();
  if (error) throw error;
  const [signals, opportunities, risks, swots] = await Promise.all([
    supabase.from("cf_signals").select("*").eq("location_id", brief.location_id),
    supabase.from("cf_opportunities").select("*").eq("location_id", brief.location_id),
    supabase.from("cf_risks").select("*").eq("location_id", brief.location_id),
    supabase.from("cf_swots").select("*").eq("location_id", brief.location_id).order("created_at", { ascending: false }).limit(1)
  ]);
  return { ...brief, signals: signals.data || [], opportunities: opportunities.data || [], risks: risks.data || [], swot: swots.data?.[0] || {} };
}

function Header({ user, onWorkspace, onHome, onSignOut }) {
  const accountName = user?.user_metadata?.username
    || user?.user_metadata?.full_name
    || user?.email?.split("@")[0]
    || "Account";

  return (
    <header className="site-header">
      <button className="brand" onClick={onHome}>CHRONICLE <span>FUTURE</span></button>
      <nav aria-label="Primary navigation">
        <button className="nav-link" onClick={onHome}>Global feed</button>
        {user ? <button className="nav-link" onClick={onWorkspace}>My locations</button> : null}
      </nav>
      {user ? (
        <div className="account-actions">
          <button className="account-identity" onClick={onWorkspace} title={user.email}>
            <span className="account-dot" aria-hidden="true" />
            <span><small>Signed in</small><strong>{accountName}</strong></span>
          </button>
          <button className="signout-button" onClick={onSignOut}>Sign out</button>
        </div>
      ) : <a className="account-button" href="#access">Open your intelligence</a>}
    </header>
  );
}

function AuthPanel() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: AUTH_REDIRECT_URL, shouldCreateUser: true }
    });
    setStatus(error ? error.message : "Check your email for your secure sign-in link.");
    setLoading(false);
  };

  return (
    <section className="access-band" id="access">
      <div>
        <p className="kicker light">Your strategic layer</p>
        <h2>See what global change means for your location.</h2>
      </div>
      <form className="access-form" onSubmit={submit}>
        <label htmlFor="email">Work email</label>
        <div className="input-row">
          <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required />
          <button disabled={loading}>{loading ? "Sending..." : "Continue"}</button>
        </div>
        <p>{status || "Sign in to unlock location briefs, SWOT, opportunities, risks, and forecasts."}</p>
      </form>
    </section>
  );
}

function PublicLanding({ user, onWorkspace }) {
  const lead = PUBLIC_SIGNALS[0];
  return (
    <main>
      <section className="feed-hero">
        <div className="hero-copy">
          <p className="kicker">Global intelligence feed</p>
          <h1>See the forces shaping what comes next.</h1>
          <p className="hero-deck">A public briefing on economic, technological, resource, and geopolitical signals with consequences for places, industries, and operators.</p>
          <div className="feed-meta"><span className="live-dot" /> Intelligence watchlist <span>{displayDate()}</span></div>
        </div>
        <article className="lead-signal">
          <div className="signal-topline"><span>{lead.scope}</span><strong>Impact {lead.impact}</strong></div>
          <p className="region">{lead.region}</p>
          <h2>{lead.title}</h2>
          <p>{lead.summary}</p>
          <div className="horizon">Time horizon <strong>{lead.horizon}</strong></div>
        </article>
      </section>

      <section className="ticker" aria-label="Areas under watch">
        <span>UNDER WATCH</span><span>AI INFRASTRUCTURE</span><span>ENERGY CAPACITY</span><span>TRADE CORRIDORS</span><span>CRITICAL MINERALS</span><span>DEMOGRAPHICS</span>
      </section>

      <section className="feed-section">
        <div className="section-title"><div><p className="kicker">Major signals</p><h2>What the world is telling us</h2></div><p>Ranked by likely structural impact, not by the volume of headlines.</p></div>
        <div className="feed-grid">
          {PUBLIC_SIGNALS.slice(1).map((signal, index) => (
            <article className="signal-card" key={signal.title}>
              <div className="signal-number">0{index + 2}</div>
              <div className="signal-topline"><span>{signal.scope}</span><strong>{signal.impact}</strong></div>
              <p className="region">{signal.region}</p>
              <h3>{signal.title}</h3>
              <p>{signal.summary}</p>
              <div className="horizon">Horizon <strong>{signal.horizon}</strong></div>
            </article>
          ))}
        </div>
      </section>

      <section className="conversion-band">
        <p className="kicker light">From macro to local</p>
        <h2>The signal is global. The consequence is local.</h2>
        <p>Chronicle Future connects world-scale change to a specific city, workforce, industry mix, infrastructure base, and business environment.</p>
        {user ? <button onClick={onWorkspace}>Open my location intelligence</button> : <a href="#access">Analyze your location</a>}
      </section>
      {!user ? <AuthPanel /> : null}
    </main>
  );
}

function LocationForm({ userId, onCreated }) {
  const [form, setForm] = useState({ city: "", state: "", zip: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createLocation(form, userId);
      setForm({ city: "", state: "", zip: "" });
      onCreated();
    } catch (err) { setError(err.message || "Unable to save location."); }
    finally { setSaving(false); }
  };
  return (
    <form className="location-form" onSubmit={submit}>
      <div><p className="kicker">New intelligence territory</p><h2>Add a location</h2></div>
      <label>City<input value={form.city} onChange={update("city")} placeholder="Bay City" required /></label>
      <label>State<input value={form.state} onChange={update("state")} placeholder="MI" maxLength={2} required /></label>
      <label>ZIP code<input value={form.zip} onChange={update("zip")} placeholder="48708" inputMode="numeric" required /></label>
      <button disabled={saving}>{saving ? "Saving..." : "Create location"}</button>
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}

function Dashboard({ user, onOpenBrief }) {
  const [locations, setLocations] = useState([]);
  const [briefs, setBriefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const refresh = async () => {
    setLoading(true);
    try { const data = await loadDashboardData(user.id); setLocations(data.locations); setBriefs(data.briefs); }
    catch (error) { setMessage(error.message || "Unable to load your workspace."); }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, [user.id]);
  const briefsByLocation = useMemo(() => briefs.reduce((map, brief) => ({ ...map, [brief.location_id]: [...(map[brief.location_id] || []), brief] }), {}), [briefs]);
  const run = async (type, locationId) => {
    setBusy(`${type}:${locationId}`); setMessage("");
    try {
      const response = await fetch(type === "ingest" ? "/api/ingest-signals" : "/api/generate-intelligence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location_id: locationId }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Request failed.");
      setMessage(type === "ingest" ? `Stored ${payload.saved_count || 0} new signals.` : "Your intelligence brief is ready.");
      if (type === "generate") { await refresh(); if (payload.brief_id) onOpenBrief(payload.brief_id); }
    } catch (error) { setMessage(error.message || "Request failed."); }
    finally { setBusy(""); }
  };
  return (
    <main className="workspace">
      <section className="workspace-head"><div><p className="kicker">Private intelligence workspace</p><h1>Your locations</h1><p>Turn global change into local risks, opportunities, SWOT, and forward scenarios.</p></div><LocationForm userId={user.id} onCreated={refresh} /></section>
      {message ? <p className="workspace-notice">{message}</p> : null}
      <section className="workspace-section"><div className="section-title"><div><p className="kicker">Coverage</p><h2>Location portfolio</h2></div><button className="text-button" onClick={refresh}>{loading ? "Refreshing..." : "Refresh"}</button></div>
        <div className="location-list">
          {locations.map((location) => <article className="location-row" key={location.id}><div><p className="region">{location.zip}</p><h3>{location.city}, {location.state}</h3><p>{briefsByLocation[location.id]?.length || 0} intelligence briefs</p></div><div className="location-actions"><button className="outline" onClick={() => run("ingest", location.id)} disabled={!!busy}>{busy === `ingest:${location.id}` ? "Ingesting..." : "Refresh signals"}</button><button onClick={() => run("generate", location.id)} disabled={!!busy}>{busy === `generate:${location.id}` ? "Generating..." : "Generate brief"}</button></div></article>)}
          {!locations.length && !loading ? <div className="empty-state"><h3>No locations yet</h3><p>Add the first place you want Chronicle Future to monitor.</p></div> : null}
        </div>
      </section>
      {briefs.length ? <section className="workspace-section"><p className="kicker">Archive</p><h2>Recent briefs</h2><div className="brief-list">{briefs.map((brief) => <button key={brief.id} onClick={() => onOpenBrief(brief.id)}><span>{brief.week_of ? `Weekly intelligence: ${displayDate(brief.week_of)}` : "Intelligence brief"}</span><small>{displayDate(brief.created_at)}</small></button>)}</div></section> : null}
    </main>
  );
}

function BriefPage({ briefId, onBack }) {
  const [brief, setBrief] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { let active = true; loadBrief(briefId).then((data) => active && setBrief(data)).catch((err) => active && setError(err.message)); return () => { active = false; }; }, [briefId]);
  if (error) return <main className="workspace"><button className="text-button" onClick={onBack}>Back to locations</button><p className="error">{error}</p></main>;
  if (!brief) return <main className="workspace"><p>Loading intelligence...</p></main>;
  return (
    <main className="workspace brief-page"><button className="text-button" onClick={onBack}>Back to locations</button><section className="brief-masthead"><p className="kicker">Weekly intelligence brief</p><h1>{displayDate(brief.week_of || brief.created_at)}</h1><p>{brief.decade_outlook || "A structured view of the signals shaping this location."}</p></section>
      <section className="brief-grid">{SIGNAL_GROUPS.map((group) => { const field = `${group.toLowerCase()}_signals`; const matching = brief.signals.filter((signal) => (signal.signal_type || "").toLowerCase().includes(group.toLowerCase())); return <article key={group}><p className="kicker">{group}</p>{brief[field] ? <p>{brief[field]}</p> : matching.map((signal) => <div className="brief-item" key={signal.id}><h3>{signal.title}</h3><p>{signal.summary}</p></div>)}</article>; })}</section>
      <section className="two-column"><article><p className="kicker">Opportunities</p>{brief.opportunities.map((item) => <div className="brief-item" key={item.id}><h3>{item.title}</h3><p>{item.description}</p></div>)}</article><article><p className="kicker">Risks</p>{brief.risks.map((item) => <div className="brief-item" key={item.id}><h3>{item.title}</h3><p>{item.description}</p></div>)}</article></section>
      <section className="swot-grid">{["strengths", "weaknesses", "opportunities", "threats"].map((key) => <article key={key}><p className="kicker">{key}</p><ul>{(Array.isArray(brief.swot[key]) ? brief.swot[key] : []).map((item) => <li key={item}>{item}</li>)}</ul></article>)}</section>
    </main>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [view, setView] = useState("public");
  const [briefId, setBriefId] = useState(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user || null;
      setUser(sessionUser);
      if (sessionUser) setView("workspace");
      setAuthReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      const sessionUser = session?.user || null;
      setUser(sessionUser);
      if (sessionUser && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        setView("workspace");
        setBriefId(null);
      }
      setAuthReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  const home = () => { setView("public"); setBriefId(null); window.scrollTo(0, 0); };
  const workspace = () => { if (user) { setView("workspace"); setBriefId(null); window.scrollTo(0, 0); } };
  const signOut = async () => { await supabase.auth.signOut(); home(); };
  return <><style>{STYLES}</style><Header user={user} onHome={home} onWorkspace={workspace} onSignOut={signOut} />{!authReady ? <main className="loading-screen">Loading Chronicle Future...</main> : briefId ? <BriefPage briefId={briefId} onBack={workspace} /> : view === "workspace" && user ? <Dashboard user={user} onOpenBrief={setBriefId} /> : <PublicLanding user={user} onWorkspace={workspace} />}</>;
}

const STYLES = `
  :root { color: #121a21; background: #f3f4f1; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-synthesis: none; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #f3f4f1; }
  button, input { font: inherit; }
  button, a { -webkit-tap-highlight-color: transparent; }
  button { cursor: pointer; }
  h1, h2, h3, p { margin-top: 0; }
  h1, h2, h3 { font-family: Georgia, "Times New Roman", serif; font-weight: 500; }
  .site-header { position: sticky; top: 0; z-index: 20; height: 66px; padding: 0 max(24px, calc((100vw - 1240px) / 2)); display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; border-bottom: 1px solid #c8cec8; background: rgba(243,244,241,.96); }
  .brand { border: 0; background: none; padding: 0; justify-self: start; color: #111920; font-weight: 900; letter-spacing: .04em; }
  .brand span { color: #176b4d; }
  nav { display: flex; gap: 28px; }
  .nav-link { border: 0; background: none; color: #35414a; padding: 8px 0; font-size: 14px; }
  .account-button { justify-self: end; border: 1px solid #1a3229; border-radius: 4px; background: #173e30; color: white; padding: 10px 15px; font-size: 13px; font-weight: 700; text-decoration: none; }
  .account-actions { justify-self: end; display: flex; align-items: center; gap: 10px; }
  .account-identity { display: flex; align-items: center; gap: 9px; border: 0; background: transparent; color: #15221b; padding: 5px 0; text-align: left; }
  .account-identity span:last-child { display: grid; gap: 1px; }
  .account-identity small { color: #758078; font-size: 9px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
  .account-identity strong { max-width: 150px; overflow: hidden; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
  .account-dot { width: 9px; height: 9px; border-radius: 50%; background: #20a66a; box-shadow: 0 0 0 4px rgba(32,166,106,.12); }
  .signout-button { border: 1px solid #b9c1bb; border-radius: 4px; background: transparent; color: #344139; padding: 8px 10px; font-size: 11px; font-weight: 800; }
  .feed-hero { min-height: 610px; display: grid; grid-template-columns: 1.1fr .9fr; gap: 68px; align-items: center; max-width: 1240px; margin: auto; padding: 70px 24px; }
  .kicker { color: #176b4d; font-size: 11px; font-weight: 900; letter-spacing: .15em; text-transform: uppercase; }
  .kicker.light { color: #9fe0c5; }
  .hero-copy h1 { max-width: 720px; margin-bottom: 28px; font-size: 72px; line-height: .98; }
  .hero-deck { max-width: 700px; color: #52606a; font-size: 20px; line-height: 1.6; }
  .feed-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin-top: 34px; color: #68747d; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
  .live-dot { width: 8px; height: 8px; border-radius: 50%; background: #20a66a; box-shadow: 0 0 0 4px rgba(32,166,106,.12); }
  .lead-signal { border-top: 5px solid #176b4d; background: #fff; padding: 36px; box-shadow: 0 20px 60px rgba(25,42,33,.08); }
  .signal-topline { display: flex; justify-content: space-between; gap: 16px; color: #176b4d; font-size: 11px; font-weight: 900; letter-spacing: .11em; text-transform: uppercase; }
  .region { margin: 16px 0 10px; color: #78837b; font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
  .lead-signal h2 { margin-bottom: 20px; font-size: 38px; line-height: 1.1; }
  .lead-signal > p:not(.region) { color: #52606a; line-height: 1.65; }
  .horizon { border-top: 1px solid #dce1dc; margin-top: 26px; padding-top: 16px; color: #68747d; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
  .horizon strong { float: right; color: #1c2822; }
  .ticker { overflow: hidden; display: flex; justify-content: center; gap: 34px; background: #173e30; color: #d7e8df; padding: 15px 24px; white-space: nowrap; font-size: 11px; font-weight: 800; letter-spacing: .11em; }
  .ticker span:first-child { color: #9fe0c5; }
  .feed-section, .workspace { max-width: 1240px; margin: auto; padding: 82px 24px; }
  .section-title { display: flex; align-items: end; justify-content: space-between; gap: 30px; margin-bottom: 34px; }
  .section-title h2, .workspace-section > h2 { margin-bottom: 0; font-size: 42px; }
  .section-title > p { max-width: 420px; color: #667169; line-height: 1.55; }
  .feed-grid { display: grid; grid-template-columns: repeat(6, 1fr); border-top: 1px solid #bbc3bc; border-left: 1px solid #bbc3bc; }
  .signal-card { position: relative; grid-column: span 2; min-height: 390px; padding: 28px; border-right: 1px solid #bbc3bc; border-bottom: 1px solid #bbc3bc; background: #f8f9f6; }
  .signal-card:nth-child(4), .signal-card:nth-child(5) { grid-column: span 3; }
  .signal-number { margin-bottom: 56px; color: #a5aea7; font-family: Georgia, serif; font-size: 30px; }
  .signal-card h3 { margin-bottom: 16px; font-size: 28px; line-height: 1.15; }
  .signal-card > p:not(.region) { color: #59655e; line-height: 1.6; }
  .conversion-band { padding: 88px max(24px, calc((100vw - 1000px) / 2)); text-align: center; background: #111d18; color: white; }
  .conversion-band h2 { margin: 0 auto 22px; max-width: 760px; font-size: 52px; }
  .conversion-band > p:not(.kicker) { max-width: 700px; margin: 0 auto 30px; color: #b9c9c1; font-size: 18px; line-height: 1.6; }
  .conversion-band a, .conversion-band button { display: inline-block; border: 0; border-radius: 4px; padding: 14px 20px; background: #c8f05a; color: #142019; font-weight: 900; text-decoration: none; }
  .access-band { display: grid; grid-template-columns: .9fr 1.1fr; gap: 80px; align-items: center; padding: 70px max(24px, calc((100vw - 1100px) / 2)); background: #176b4d; color: white; }
  .access-band h2 { margin: 0; font-size: 42px; }
  .access-form label { display: block; margin-bottom: 9px; font-size: 13px; font-weight: 800; }
  .input-row { display: grid; grid-template-columns: 1fr auto; }
  .input-row input { min-width: 0; border: 0; padding: 15px; }
  .input-row button { border: 0; background: #c8f05a; color: #142019; padding: 0 20px; font-weight: 900; }
  .access-form > p { margin: 10px 0 0; color: #d4e6dc; font-size: 12px; }
  .loading-screen { min-height: 70vh; display: grid; place-items: center; }
  .workspace { display: grid; gap: 54px; }
  .workspace-head { display: grid; grid-template-columns: 1fr 460px; gap: 70px; align-items: center; }
  .workspace-head h1, .brief-masthead h1 { margin-bottom: 22px; font-size: 68px; line-height: 1; }
  .workspace-head > div > p:last-child, .brief-masthead > p:last-child { max-width: 610px; color: #58645d; font-size: 18px; line-height: 1.6; }
  .location-form, .workspace-section, .brief-grid > article, .two-column > article, .swot-grid > article { border: 1px solid #c8cec8; background: #fff; padding: 28px; }
  .location-form { display: grid; grid-template-columns: 1fr 80px 120px; gap: 14px; }
  .location-form > div, .location-form > button, .location-form .error { grid-column: 1 / -1; }
  label { color: #465149; font-size: 12px; font-weight: 800; }
  label input { width: 100%; margin-top: 7px; border: 1px solid #b8c0ba; border-radius: 3px; padding: 11px; }
  .location-form button, .location-actions button { border: 0; border-radius: 3px; background: #176b4d; color: white; padding: 12px 16px; font-weight: 800; }
  .error, .workspace-notice { color: #9f2f25; font-weight: 700; }
  .text-button { border: 0; background: none; color: #176b4d; padding: 0; font-weight: 800; }
  .location-list { display: grid; }
  .location-row { display: flex; justify-content: space-between; gap: 24px; align-items: center; border-top: 1px solid #d7dcd7; padding: 24px 0; }
  .location-row h3 { margin-bottom: 7px; font-size: 30px; }
  .location-row p { margin-bottom: 0; color: #677169; }
  .location-actions { display: flex; gap: 10px; }
  .location-actions .outline { border: 1px solid #176b4d; background: transparent; color: #176b4d; }
  .location-actions button:disabled { opacity: .55; cursor: wait; }
  .empty-state { padding: 45px 0 20px; color: #677169; }
  .brief-list { display: grid; gap: 8px; margin-top: 28px; }
  .brief-list button { display: flex; justify-content: space-between; gap: 20px; border: 0; border-top: 1px solid #d7dcd7; background: transparent; color: #17231d; padding: 18px 0; text-align: left; }
  .brief-grid { display: grid; grid-template-columns: repeat(3, 1fr); }
  .brief-grid > article, .two-column > article, .swot-grid > article { margin: -1px 0 0 -1px; min-height: 240px; }
  .brief-item { border-top: 1px solid #d7dcd7; padding-top: 16px; margin-top: 16px; }
  .brief-item h3 { font-size: 22px; }
  .brief-item p, .brief-grid p, .two-column p, .swot-grid li { color: #59655e; line-height: 1.55; }
  .two-column { display: grid; grid-template-columns: 1fr 1fr; }
  .swot-grid { display: grid; grid-template-columns: repeat(4, 1fr); }
  @media (max-width: 900px) {
    .site-header { grid-template-columns: 1fr auto; padding: 0 16px; } nav { display: none; }
    .feed-hero, .workspace-head, .access-band { grid-template-columns: 1fr; gap: 34px; }
    .feed-hero { padding-top: 46px; } .hero-copy h1, .workspace-head h1, .brief-masthead h1 { font-size: 48px; }
    .ticker { justify-content: flex-start; overflow-x: auto; }
    .feed-grid { grid-template-columns: 1fr; } .signal-card, .signal-card:nth-child(4), .signal-card:nth-child(5) { grid-column: auto; min-height: 0; }
    .signal-number { margin-bottom: 34px; } .section-title, .location-row { display: grid; }
    .location-form { grid-template-columns: 1fr; } .location-form > * { grid-column: 1 !important; }
    .brief-grid, .two-column, .swot-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 520px) {
    .account-button { padding: 9px 10px; font-size: 11px; } .brand { font-size: 12px; }
    .account-identity small, .signout-button { display: none; }
    .account-identity strong { max-width: 105px; font-size: 12px; }
    .feed-hero { min-height: auto; } .hero-copy h1 { font-size: 42px; }
    .lead-signal, .signal-card, .location-form, .workspace-section { padding: 22px; }
    .conversion-band h2, .access-band h2, .section-title h2 { font-size: 36px; }
    .input-row, .location-actions { grid-template-columns: 1fr; display: grid; }
  }
`;
