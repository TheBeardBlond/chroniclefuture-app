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
const BRIEF_FIELDS = {
  Local: "local_signals",
  State: "state_signals",
  National: "national_signals",
  Global: "global_signals",
  Technology: "technology_watch",
  Commodity: "commodity_watch"
};
const AUTH_REDIRECT_URL = window.location.origin;

const displayDate = (value) => new Date(value || Date.now()).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
const longDate = (value) => new Date(value || Date.now()).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });

async function loadDashboardData(userId) {
  const [{ data: locations, error: locationError }, { data: briefs, error: briefError }, { data: issues, error: issueError }, { data: entitlement, error: entitlementError }] = await Promise.all([
    supabase.from("cf_locations").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("cf_briefs").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("cf_magazine_issues").select("*").order("created_at", { ascending: false }),
    supabase.from("cf_entitlements").select("*").eq("user_id", userId).maybeSingle()
  ]);
  if (locationError) throw locationError;
  if (briefError) throw briefError;
  if (issueError) throw issueError;
  if (entitlementError) throw entitlementError;
  return { locations: locations || [], briefs: briefs || [], issues: issues || [], entitlement };
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
  const [signals, scores, opportunities, risks, swots] = await Promise.all([
    supabase.from("cf_signals").select("*").eq("brief_id", briefId),
    supabase.from("cf_signal_scores").select("*").eq("brief_id", briefId),
    supabase.from("cf_opportunities").select("*").eq("brief_id", briefId),
    supabase.from("cf_risks").select("*").eq("brief_id", briefId),
    supabase.from("cf_swots").select("*").eq("brief_id", briefId).limit(1)
  ]);
  const requestError = [signals, scores, opportunities, risks, swots].find((result) => result.error)?.error;
  if (requestError) throw requestError;
  const scoresBySignal = (scores.data || []).reduce((map, item) => ({ ...map, [item.signal_id]: item }), {});
  return {
    ...brief,
    signals: (signals.data || []).map((item) => ({ ...item, score: scoresBySignal[item.id] })),
    opportunities: opportunities.data || [],
    risks: risks.data || [],
    swot: swots.data?.[0] || {}
  };
}

async function loadMagazine(issueId) {
  const [issueResult, articleResult] = await Promise.all([
    supabase.from("cf_magazine_issues").select("*").eq("id", issueId).single(),
    supabase.from("cf_magazine_articles").select("*").eq("issue_id", issueId).order("sort_order")
  ]);
  if (issueResult.error) throw issueResult.error;
  if (articleResult.error) throw articleResult.error;
  return { issue: issueResult.data, articles: articleResult.data || [] };
}

async function saveMagazine(issue, articles) {
  const updatedAt = new Date().toISOString();
  const issueResult = await supabase.from("cf_magazine_issues").update({
    title: issue.title,
    subtitle: issue.subtitle,
    dek: issue.dek,
    editor_note: issue.editor_note,
    status: issue.status,
    updated_at: updatedAt
  }).eq("id", issue.id).select("id").single();
  if (issueResult.error) throw issueResult.error;
  const articleResults = await Promise.all(articles.map((article) => supabase.from("cf_magazine_articles").update({
    section: article.section,
    headline: article.headline,
    subheadline: article.subheadline,
    body: article.body,
    pull_quote: article.pull_quote,
    source_note: article.source_note,
    status: article.status,
    updated_at: updatedAt
  }).eq("id", article.id).select("id").single()));
  const articleError = articleResults.find((result) => result.error)?.error;
  if (articleError) throw articleError;
}

async function authorizedFetch(url, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Your session has expired. Sign in again.");
  return fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}` }
  });
}

/* ----------------------------------------------------------------------------
   Shared data-visualization primitives (bespoke, print-safe inline SVG / CSS)
---------------------------------------------------------------------------- */

const toScore = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  // Accept either a 0-10 or a 0-100 scale and normalize to a 0-100 percentage.
  const scaled = n <= 10 ? n * 10 : n;
  return Math.max(0, Math.min(100, scaled));
};

const horizonToYears = (text) => {
  const value = String(text || "").toLowerCase();
  const numbers = value.match(/\d+(?:\.\d+)?/g);
  if (!numbers) return null;
  const upper = Number(numbers[numbers.length - 1]);
  if (!Number.isFinite(upper)) return null;
  if (value.includes("month") || value.includes("quarter")) return upper / 12;
  return upper;
};

function Meter({ label, value, suffix = "", tone = "green" }) {
  const pct = toScore(value);
  if (pct === null) return null;
  return (
    <div className={`meter meter-${tone}`}>
      <span className="meter-label">{label}</span>
      <span className="meter-track"><span className="meter-fill" style={{ width: `${pct}%` }} /></span>
      <span className="meter-value">{value}{suffix}</span>
    </div>
  );
}

function KeyNumber({ value, label, note }) {
  return (
    <div className="key-number">
      <strong>{value}</strong>
      <span>{label}</span>
      {note ? <small>{note}</small> : null}
    </div>
  );
}

// Ranked horizontal bar chart, used on the public feed for the impact index.
function RankedBars({ items, max = 100 }) {
  return (
    <ol className="ranked-bars" aria-label="Ranked structural impact index">
      {items.map((item) => {
        const pct = Math.max(2, Math.min(100, (Number(item.value) / max) * 100));
        return (
          <li key={item.label}>
            <span className="ranked-scope">{item.label}</span>
            <span className="ranked-track">
              <span className="ranked-fill" style={{ width: `${pct}%` }} />
            </span>
            <span className="ranked-value">{item.value}</span>
          </li>
        );
      })}
    </ol>
  );
}

// Two-lane horizon map placing items on a time axis by their stated horizon.
function HorizonMap({ lanes }) {
  const points = lanes.flatMap((lane) => lane.items.map((item) => horizonToYears(item.horizon)).filter((value) => value !== null));
  if (!points.length) return null;
  const maxYears = Math.max(6, ...points);
  const ticks = [0, 1, 3, 5, 10].filter((tick) => tick <= maxYears);
  if (ticks[ticks.length - 1] !== Math.ceil(maxYears)) ticks.push(Math.ceil(maxYears));
  const place = (years) => `${Math.max(1.5, Math.min(98, (years / maxYears) * 100))}%`;
  return (
    <div className="horizon-map" role="img" aria-label="Time-horizon map of opportunities and risks">
      <div className="horizon-axis">
        {ticks.map((tick) => (
          <span key={tick} style={{ left: `${(tick / maxYears) * 100}%` }}>{tick === 0 ? "Now" : `${tick}y`}</span>
        ))}
      </div>
      {lanes.map((lane) => (
        <div className={`horizon-lane horizon-${lane.tone}`} key={lane.label}>
          <span className="horizon-lane-label">{lane.label}</span>
          <div className="horizon-track">
            {lane.items.map((item, index) => {
              const years = horizonToYears(item.horizon);
              if (years === null) return null;
              return <span className="horizon-dot" key={`${item.title}-${index}`} style={{ left: place(years) }} title={`${item.title} · ${item.horizon}`}><em>{item.horizon}</em></span>;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------------------
   Conversion + commerce
---------------------------------------------------------------------------- */

function PricingSection({ user }) {
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  const checkout = async (offer) => {
    if (!user) {
      document.getElementById("access")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setLoading(offer);
    setError("");
    try {
      const response = await authorizedFetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to open checkout.");
      window.location.assign(payload.url);
    } catch (checkoutError) {
      setError(checkoutError.message || "Unable to open checkout.");
      setLoading("");
    }
  };

  return (
    <section className="pricing-section" id="pricing">
      <div className="section-head">
        <div><p className="kicker">Private intelligence</p><h2>Choose how you use Chronicle Future</h2></div>
        <p>Start with one decision-ready brief, or maintain a standing view of the forces shaping your location.</p>
      </div>
      <div className="pricing-grid">
        <article className="price-card">
          <header><p className="kicker">One-time</p><h3><span className="price-figure">$19</span><span className="price-unit">per brief</span></h3></header>
          <p className="price-copy">One complete location intelligence brief: signals, opportunity scoring, risks, SWOT, and a decade outlook.</p>
          <ul className="price-list">
            <li>Full signal breakdown across six scopes</li>
            <li>Scored opportunities and risks</li>
            <li>Geographic SWOT and decade outlook</li>
          </ul>
          <button className="btn btn-outline" onClick={() => checkout("one_time")} disabled={!!loading}>{loading === "one_time" ? "Opening checkout…" : user ? "Buy one brief" : "Sign in to purchase"}</button>
        </article>
        <article className="price-card featured">
          <span className="price-flag">Most chosen</span>
          <header><p className="kicker light">Monthly intelligence</p><h3><span className="price-figure">$39</span><span className="price-unit">per month</span></h3></header>
          <p className="price-copy">Four briefs every billing period, a saved archive, and access to Chronicle Future's publisher-produced magazine editions.</p>
          <ul className="price-list">
            <li>Four location briefs each period</li>
            <li>Persistent intelligence archive</li>
            <li>Every published magazine edition</li>
          </ul>
          <button className="btn btn-lime" onClick={() => checkout("monthly")} disabled={!!loading}>{loading === "monthly" ? "Opening checkout…" : user ? "Start monthly access" : "Sign in to subscribe"}</button>
        </article>
      </div>
      {error ? <p className="pricing-error" role="alert">{error}</p> : null}
    </section>
  );
}

function formatMarketPrice(value) {
  if (!Number.isFinite(value)) return "--";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 1000 ? 0 : 2,
    minimumFractionDigits: value < 10 ? 2 : 0
  }).format(value);
}

/* ----------------------------------------------------------------------------
   Header tickers (markets + news wire) — behavior preserved
---------------------------------------------------------------------------- */

function MarketTicker() {
  const [feed, setFeed] = useState({ market: [], news: [], as_of: null });
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch("/api/market-feed");
        if (!response.ok) throw new Error("Market feed unavailable.");
        const payload = await response.json();
        if (!active) return;
        setFeed({ market: payload.market || [], news: payload.news || [], as_of: payload.as_of || null });
        setStatus(payload.market?.length || payload.news?.length ? "ready" : "empty");
      } catch (error) {
        if (active) setStatus("error");
      }
    };

    load();
    const timer = window.setInterval(load, 300000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const renderMarketSet = (copy, hidden = false) => (
    <div className="market-tape-set" aria-hidden={hidden || undefined}>
      {feed.market.length ? feed.market.map((item) => (
        <span className="market-quote" key={`${copy}-${item.symbol}`}>
          <strong>{item.label}</strong>
          <span>{formatMarketPrice(item.price)}</span>
          <em className={item.change_percent > 0 ? "up" : item.change_percent < 0 ? "down" : "flat"}>
            {Number.isFinite(item.change_percent) ? `${item.change_percent >= 0 ? "+" : ""}${item.change_percent.toFixed(2)}%` : "--"}
          </em>
        </span>
      )) : <span className="market-fallback">{status === "loading" ? "Loading delayed prices" : "Market prices temporarily unavailable"}</span>}
    </div>
  );

  const renderNewsSet = (copy, hidden = false) => (
    <div className="market-tape-set" aria-hidden={hidden || undefined}>
      {feed.news.length ? feed.news.map((item, index) => (
        <a className="market-headline" href={item.url} target="_blank" rel="noreferrer" tabIndex={hidden ? -1 : undefined} key={`${copy}-${index}`}>
          <small>{item.source}</small>{item.title}
        </a>
      )) : <span className="market-fallback">{status === "loading" ? "Loading global headlines" : "News feed temporarily unavailable"}</span>}
    </div>
  );

  return (
    <>
      <section className="market-tape market-tape-prices" aria-label="Delayed stock index and commodity prices">
        <div className="market-tape-label"><strong>MARKETS</strong><span>Delayed</span></div>
        <div className={`market-tape-window ${feed.market.length ? "is-moving" : ""}`}>
          <div className="market-tape-track">
            {renderMarketSet("market-primary")}
            {feed.market.length ? renderMarketSet("market-copy", true) : null}
          </div>
        </div>
        <time>{feed.as_of ? new Date(feed.as_of).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "--"}</time>
      </section>
      <section className="market-tape market-tape-news" aria-label="Global business and economic headlines">
        <div className="market-tape-label"><strong>NEWS WIRE</strong><span>Global</span></div>
        <div className={`market-tape-window ${feed.news.length ? "is-moving" : ""}`}>
          <div className="market-tape-track">
            {renderNewsSet("news-primary")}
            {feed.news.length ? renderNewsSet("news-copy", true) : null}
          </div>
        </div>
        <time>{feed.news.length ? `${feed.news.length} stories` : "--"}</time>
      </section>
    </>
  );
}

function Header({ user, onWorkspace, onHome, onSignOut }) {
  const accountName = user?.user_metadata?.username
    || user?.user_metadata?.full_name
    || user?.email?.split("@")[0]
    || "Account";

  return (
    <div className="header-stack">
      <MarketTicker />
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
    </div>
  );
}

function AuthPanel() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!cooldown) return undefined;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown > 0]);

  const submit = async (event) => {
    event.preventDefault();
    if (cooldown) return;
    setLoading(true);
    setStatus("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: AUTH_REDIRECT_URL, shouldCreateUser: true }
    });
    if (error) setStatus(error.message);
    else {
      setCooldown(60);
      setStatus("Secure link sent. Open the newest email once; older links expire automatically.");
    }
    setLoading(false);
  };

  return (
    <section className="access-band" id="access">
      <div className="access-copy">
        <p className="kicker light">Your strategic layer</p>
        <h2>See what global change means for your location.</h2>
        <p className="access-sub">One secure link. No passwords to manage.</p>
      </div>
      <form className="access-form" onSubmit={submit}>
        <label htmlFor="email">Work email</label>
        <div className="input-row">
          <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required />
          <button className="btn btn-lime" disabled={loading || cooldown > 0}>{loading ? "Sending…" : cooldown ? `Resend in ${cooldown}s` : "Continue"}</button>
        </div>
        <p className="access-status">{status || "Sign in to unlock location briefs, SWOT, opportunities, risks, and forecasts."}</p>
      </form>
    </section>
  );
}

/* ----------------------------------------------------------------------------
   Public global intelligence feed (landing experience)
---------------------------------------------------------------------------- */

function PublicLanding({ user, onWorkspace }) {
  const lead = PUBLIC_SIGNALS[0];
  const indexItems = [...PUBLIC_SIGNALS].sort((a, b) => b.impact - a.impact).map((signal) => ({ label: signal.scope, value: signal.impact }));
  return (
    <main className="page">
      <section className="feed-hero">
        <div className="hero-copy">
          <p className="kicker">Global intelligence feed</p>
          <h1>See the forces shaping what comes next.</h1>
          <p className="hero-deck">A public briefing on economic, technological, resource, and geopolitical signals with consequences for places, industries, and operators.</p>
          <div className="feed-meta"><span className="live-dot" aria-hidden="true" /> Intelligence watchlist <span className="feed-meta-date">{longDate()}</span></div>
        </div>
        <article className="lead-signal" aria-label="Lead signal">
          <div className="signal-topline"><span>{lead.scope}</span><strong>Impact {lead.impact}</strong></div>
          <p className="region">{lead.region}</p>
          <h2>{lead.title}</h2>
          <p className="lead-body">{lead.summary}</p>
          <Meter label="Structural impact" value={lead.impact} />
          <div className="horizon-row"><span>Time horizon</span><strong>{lead.horizon}</strong></div>
        </article>
      </section>

      <section className="watchlist" aria-label="Areas under watch">
        <span className="watchlist-label">Under watch</span>
        <span>AI infrastructure</span><span>Energy capacity</span><span>Trade corridors</span><span>Critical minerals</span><span>Demographics</span>
      </section>

      <section className="feed-section">
        <div className="section-head">
          <div><p className="kicker">Major signals</p><h2>What the world is telling us</h2></div>
          <p>Ranked by likely structural impact, not by the volume of headlines.</p>
        </div>
        <div className="feed-layout">
          <aside className="impact-index" aria-label="Structural impact index">
            <p className="panel-eyebrow">Impact index</p>
            <RankedBars items={indexItems} />
            <p className="panel-foot">Relative structural weight, 0–100.</p>
          </aside>
          <div className="feed-grid">
            {PUBLIC_SIGNALS.slice(1).map((signal, index) => (
              <article className="signal-card" key={signal.title}>
                <div className="signal-number">{String(index + 2).padStart(2, "0")}</div>
                <div className="signal-topline"><span>{signal.scope}</span><strong>{signal.impact}</strong></div>
                <p className="region">{signal.region}</p>
                <h3>{signal.title}</h3>
                <p className="signal-body">{signal.summary}</p>
                <div className="horizon-row"><span>Horizon</span><strong>{signal.horizon}</strong></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="conversion-band">
        <p className="kicker light">From macro to local</p>
        <h2>The signal is global. The consequence is local.</h2>
        <p>Chronicle Future connects world-scale change to a specific city, workforce, industry mix, infrastructure base, and business environment.</p>
        {user ? <button className="btn btn-lime" onClick={onWorkspace}>Open my location intelligence</button> : <a className="btn btn-lime" href="#access">Analyze your location</a>}
      </section>
      <PricingSection user={user} />
      {!user ? <AuthPanel /> : null}
    </main>
  );
}

/* ----------------------------------------------------------------------------
   Private workspace
---------------------------------------------------------------------------- */

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
      <div className="location-form-head"><p className="kicker">New intelligence territory</p><h2>Add a location</h2></div>
      <label>City<input value={form.city} onChange={update("city")} placeholder="Bay City" required /></label>
      <label>State<input value={form.state} onChange={update("state")} placeholder="MI" maxLength={2} required /></label>
      <label>ZIP code<input value={form.zip} onChange={update("zip")} placeholder="48708" inputMode="numeric" required /></label>
      <button className="btn btn-green" disabled={saving}>{saving ? "Saving…" : "Create location"}</button>
      {error ? <p className="error" role="alert">{error}</p> : null}
    </form>
  );
}

function Dashboard({ user, onOpenBrief, onOpenIssue }) {
  const [locations, setLocations] = useState([]);
  const [briefs, setBriefs] = useState([]);
  const [issues, setIssues] = useState([]);
  const [entitlement, setEntitlement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const refresh = async () => {
    setLoading(true);
    try { const data = await loadDashboardData(user.id); setLocations(data.locations); setBriefs(data.briefs); setIssues(data.issues); setEntitlement(data.entitlement); }
    catch (error) { setMessage(error.message || "Unable to load your workspace."); }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, [user.id]);
  useEffect(() => {
    const checkoutStatus = new URLSearchParams(window.location.search).get("checkout");
    if (checkoutStatus === "success") setMessage("Payment received. Your access will update in a moment.");
    if (checkoutStatus === "cancelled") setMessage("Checkout was cancelled. No charge was made.");
    if (checkoutStatus) window.history.replaceState({}, "", window.location.pathname);
  }, []);
  const briefsByLocation = useMemo(() => briefs.reduce((map, brief) => ({ ...map, [brief.location_id]: [...(map[brief.location_id] || []), brief] }), {}), [briefs]);
  const run = async (type, locationId) => {
    setBusy(`${type}:${locationId}`); setMessage("");
    try {
      const response = await authorizedFetch(type === "ingest" ? "/api/ingest-signals" : "/api/generate-intelligence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location_id: locationId }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Request failed.");
      setMessage(type === "ingest" ? `Stored ${payload.saved_count || 0} new signals.` : "Your intelligence brief is ready.");
      if (type === "generate") { await refresh(); if (payload.brief_id) onOpenBrief(payload.brief_id); }
    } catch (error) { setMessage(error.message || "Request failed."); }
    finally { setBusy(""); }
  };
  const createMagazine = async (briefId) => {
    setBusy(`magazine:${briefId}`);
    setMessage("");
    try {
      const response = await authorizedFetch("/api/generate-magazine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief_id: briefId })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Magazine generation failed.");
      await refresh();
      if (payload.issue_id) onOpenIssue(payload.issue_id);
    } catch (error) { setMessage(error.message || "Magazine generation failed."); }
    finally { setBusy(""); }
  };
  const openBillingPortal = async () => {
    try {
      const response = await authorizedFetch("/api/create-portal-session", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to open billing.");
      window.location.assign(payload.url);
    } catch (error) { setMessage(error.message || "Unable to open billing."); }
  };
  const allowance = entitlement?.plan === "owner"
    ? "Owner access"
    : entitlement?.plan === "monthly" && entitlement?.status === "active"
      ? `${Math.max(0, entitlement.monthly_brief_limit - entitlement.monthly_briefs_used)} of ${entitlement.monthly_brief_limit} monthly briefs remaining`
      : `${entitlement?.one_time_credits || 0} one-time brief credits`;
  const isPublisher = entitlement?.plan === "owner" && entitlement?.status === "active";
  const magazineAccess = isPublisher || (entitlement?.plan === "monthly" && entitlement?.status === "active");
  const publishedCount = issues.filter((issue) => issue.status === "published").length;
  return (
    <main className="page workspace">
      <section className="workspace-head">
        <div>
          <p className="kicker">Private intelligence workspace</p>
          <h1>Your locations</h1>
          <p className="workspace-deck">Turn global change into local risks, opportunities, SWOT, and forward scenarios.</p>
        </div>
        <LocationForm userId={user.id} onCreated={refresh} />
      </section>
      <section className="plan-bar">
        <div className="plan-id"><span className="account-dot" aria-hidden="true" /><div><small>Current access</small><strong>{allowance}</strong></div></div>
        {entitlement?.stripe_customer_id ? <button className="text-button" onClick={openBillingPortal}>Manage billing</button> : entitlement?.plan !== "owner" ? <a className="text-link" href="#workspace-pricing">View pricing</a> : null}
      </section>
      {message ? <p className="workspace-notice" role="status">{message}</p> : null}

      <section className="workspace-section">
        <div className="section-head compact">
          <div><p className="kicker">Coverage</p><h2>Location portfolio</h2></div>
          <button className="text-button" onClick={refresh}>{loading ? "Refreshing…" : "Refresh"}</button>
        </div>
        <div className="location-list">
          {locations.map((location) => (
            <article className="location-row" key={location.id}>
              <div className="location-id">
                <p className="region">{location.zip}</p>
                <h3>{location.city}, {location.state}</h3>
                <p className="location-count">{briefsByLocation[location.id]?.length || 0} intelligence {(briefsByLocation[location.id]?.length || 0) === 1 ? "brief" : "briefs"}</p>
              </div>
              <div className="location-actions">
                <button className="btn btn-outline" onClick={() => run("ingest", location.id)} disabled={!!busy}>{busy === `ingest:${location.id}` ? "Ingesting…" : "Refresh signals"}</button>
                <button className="btn btn-green" onClick={() => run("generate", location.id)} disabled={!!busy}>{busy === `generate:${location.id}` ? "Generating…" : "Generate brief"}</button>
              </div>
            </article>
          ))}
          {!locations.length && !loading ? <div className="empty-state"><h3>No locations yet</h3><p>Add the first place you want Chronicle Future to monitor.</p></div> : null}
        </div>
      </section>

      {briefs.length ? (
        <section className="workspace-section">
          <div className="section-head compact">
            <div><p className="kicker">Archive</p><h2>Recent briefs</h2></div>
            <p>{isPublisher ? "Open the analysis, or use it as the source for the next Chronicle Future edition." : "Your private archive of location intelligence."}</p>
          </div>
          <div className="brief-list">
            {briefs.map((brief) => (
              <article className="brief-row" key={brief.id}>
                <button className="brief-open" onClick={() => onOpenBrief(brief.id)}>
                  <span className="brief-title">{brief.title || (brief.week_of ? `Weekly intelligence: ${displayDate(brief.week_of)}` : "Intelligence brief")}</span>
                  <small>{displayDate(brief.created_at)}</small>
                </button>
                {isPublisher ? <button className="btn btn-outline btn-sm" onClick={() => createMagazine(brief.id)} disabled={!!busy}>{busy === `magazine:${brief.id}` ? "Writing issue…" : "Produce magazine"}</button> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className={`workspace-section ${isPublisher ? "publisher-studio" : "magazine-library"}`}>
        <div className="section-head compact">
          <div>
            <p className="kicker">{isPublisher ? "Production" : "Chronicle Future editions"}</p>
            <h2>{isPublisher ? "Publisher studio" : "Magazine library"}</h2>
          </div>
          <p>{isPublisher ? "Produce, review, and publish evidence-led editions for Chronicle Future subscribers." : "Read the weekly and monthly editions produced by the Chronicle Future intelligence desk."}</p>
        </div>
        {isPublisher ? <div className="studio-stats"><KeyNumber value={issues.length} label="Editions in studio" /><KeyNumber value={publishedCount} label="Published" /><KeyNumber value={issues.length - publishedCount} label="In production" /></div> : null}
        {issues.length ? (
          <div className="issue-list">
            {issues.map((issue) => (
              <button className="issue-row" key={issue.id} onClick={() => onOpenIssue(issue.id)}>
                <span className="issue-meta">
                  <small className={`status-pill status-${issue.status}`}>{issue.status}</small>
                  <strong>{issue.title}</strong>
                  <em>{issue.subtitle}</em>
                </span>
                <time>{displayDate(issue.edition_date)}</time>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No editions available yet</h3>
            <p>{isPublisher ? "Produce the first edition from a saved intelligence brief." : magazineAccess ? "The next Chronicle Future edition will appear here when it is published." : "Magazine access is included with the monthly subscription."}</p>
          </div>
        )}
      </section>
      {entitlement?.plan !== "owner" ? <div id="workspace-pricing"><PricingSection user={user} /></div> : null}
    </main>
  );
}

/* ----------------------------------------------------------------------------
   Full intelligence brief
---------------------------------------------------------------------------- */

function BriefPage({ briefId, onBack }) {
  const [brief, setBrief] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { let active = true; loadBrief(briefId).then((data) => active && setBrief(data)).catch((err) => active && setError(err.message)); return () => { active = false; }; }, [briefId]);
  if (error) return <main className="page workspace"><button className="text-button" onClick={onBack}>← Back to locations</button><p className="error" role="alert">{error}</p></main>;
  if (!brief) return <main className="page workspace"><div className="loading-block"><span className="loading-bar" /><span className="loading-bar" /><span className="loading-bar" /><p>Loading intelligence…</p></div></main>;

  const opportunities = brief.opportunities || [];
  const risks = brief.risks || [];
  const horizonLanes = [
    { label: "Opportunities", tone: "up", items: opportunities.map((item) => ({ title: item.title, horizon: item.time_horizon })) },
    { label: "Risks", tone: "down", items: risks.map((item) => ({ title: item.title, horizon: item.time_horizon })) }
  ];
  const hasHorizon = horizonLanes.some((lane) => lane.items.some((item) => horizonToYears(item.horizon) !== null));

  return (
    <main className="page workspace brief-page">
      <button className="text-button" onClick={onBack}>← Back to locations</button>
      <section className="brief-masthead">
        <p className="kicker">Weekly intelligence brief · {displayDate(brief.week_of || brief.created_at)}</p>
        <h1>{brief.title || "Location intelligence"}</h1>
        <p className="brief-lede">{brief.summary || brief.decade_outlook || "A structured view of the signals shaping this location."}</p>
        <div className="brief-stats">
          <KeyNumber value={brief.signals?.length || 0} label="Signals tracked" />
          <KeyNumber value={opportunities.length} label="Opportunities" />
          <KeyNumber value={risks.length} label="Risks" />
        </div>
        {brief.decade_outlook ? <div className="outlook"><strong>Decade outlook</strong><p>{brief.decade_outlook}</p></div> : null}
      </section>

      <section className="brief-section">
        <p className="kicker">Signal scopes</p>
        <div className="brief-grid">
          {SIGNAL_GROUPS.map((group) => {
            const field = BRIEF_FIELDS[group];
            const matching = brief.signals.filter((signal) => (signal.signal_type || "").toLowerCase() === group.toLowerCase());
            return (
              <article className="brief-cell" key={group}>
                <p className="cell-eyebrow">{group}</p>
                {matching.length ? matching.map((signal) => (
                  <div className="brief-item" key={signal.id}>
                    <h3>{signal.title}</h3>
                    <p>{signal.summary}</p>
                    {signal.score ? (
                      <div className="score-meters">
                        <Meter label="Impact" value={signal.score.impact_score} />
                        <Meter label="Confidence" value={signal.score.confidence_score} tone="ink" />
                        <Meter label="Urgency" value={signal.score.urgency_score} tone="amber" />
                      </div>
                    ) : null}
                  </div>
                )) : <p className="brief-copy">{brief[field] || "No signal persisted for this scope."}</p>}
              </article>
            );
          })}
        </div>
      </section>

      <section className="brief-section">
        <p className="kicker">Opportunities &amp; risks</p>
        <div className="two-column">
          <article className="brief-cell">
            <p className="cell-eyebrow up">Opportunities</p>
            {opportunities.length ? opportunities.map((item) => (
              <div className="brief-item" key={item.id}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <Meter label="Opportunity score" value={item.opportunity_score} tone="up" />
                <ul className="tag-row">
                  {item.confidence_level ? <li>Confidence: {item.confidence_level}</li> : null}
                  {item.capital_requirement ? <li>{item.capital_requirement} capital</li> : null}
                  {item.time_horizon ? <li>{item.time_horizon}</li> : null}
                </ul>
              </div>
            )) : <p className="brief-copy">No opportunities recorded for this brief.</p>}
          </article>
          <article className="brief-cell">
            <p className="cell-eyebrow down">Risks</p>
            {risks.length ? risks.map((item) => (
              <div className="brief-item" key={item.id}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <Meter label="Risk score" value={item.risk_score} tone="down" />
                <ul className="tag-row">
                  {item.severity ? <li>{item.severity} severity</li> : null}
                  {item.time_horizon ? <li>{item.time_horizon}</li> : null}
                </ul>
                {item.mitigation ? <p className="mitigation"><strong>Mitigation</strong> {item.mitigation}</p> : null}
              </div>
            )) : <p className="brief-copy">No risks recorded for this brief.</p>}
          </article>
        </div>
      </section>

      {hasHorizon ? (
        <section className="brief-section">
          <p className="kicker">Time horizon</p>
          <div className="brief-cell">
            <p className="cell-eyebrow">When it lands</p>
            <HorizonMap lanes={horizonLanes} />
          </div>
        </section>
      ) : null}

      <section className="brief-section">
        <p className="kicker">Geographic SWOT</p>
        <div className="swot-grid">
          {[
            { key: "strengths", tone: "up" },
            { key: "weaknesses", tone: "down" },
            { key: "opportunities", tone: "up" },
            { key: "threats", tone: "down" }
          ].map(({ key, tone }) => (
            <article className={`swot-cell swot-${tone}`} key={key}>
              <p className="cell-eyebrow">{key}</p>
              <ul>{(Array.isArray(brief.swot[key]) ? brief.swot[key] : []).map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

/* ----------------------------------------------------------------------------
   Magazine — reader edition + publisher studio
---------------------------------------------------------------------------- */

const articleParagraphs = (body) => String(body || "").split(/\n\s*\n/).filter(Boolean);
// Treat a pull quote that leads with a figure ($, %, or a number) as a key statistic.
const isStatQuote = (text) => /^[\s$£€]*\d/.test(String(text || "").trim());

function MagazineReader({ issue, articles }) {
  const sectionsSeen = new Set();
  return (
    <article className="magazine-edition">
      <section className="magazine-cover">
        <div className="cover-frame">
          <header className="cover-top">
            <span className="magazine-brand">CHRONICLE <span>FUTURE</span></span>
            <span className="cover-edition">No. {displayDate(issue.edition_date)}</span>
          </header>
          <div className="cover-asset" role="img" aria-label="Edition cover artwork placeholder">
            <span className="cover-asset-mark">CF</span>
            <span className="cover-asset-note">Intelligence edition</span>
          </div>
          <div className="cover-headline">
            <p className="kicker light">{issue.status === "published" ? "Published edition" : issue.status}</p>
            <h1>{issue.title}</h1>
            {issue.subtitle ? <h2>{issue.subtitle}</h2> : null}
            {issue.dek ? <p className="cover-dek">{issue.dek}</p> : null}
          </div>
          <footer className="cover-foot">Location intelligence · Strategy · Opportunity</footer>
        </div>
      </section>

      {articles.length ? (
        <section className="magazine-contents">
          <p className="kicker">In this edition</p>
          <ol className="toc">
            {articles.map((article, index) => (
              <li key={article.id}>
                <span className="toc-num">{String(index + 1).padStart(2, "0")}</span>
                <span className="toc-body"><strong>{article.headline}</strong><em>{article.section}</em></span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {issue.editor_note ? (
        <section className="editor-note">
          <p className="kicker">From the editor</p>
          <h2>Why this issue matters</h2>
          {articleParagraphs(issue.editor_note).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <p className="editor-sign">— The Chronicle Future Intelligence Desk</p>
        </section>
      ) : null}

      {articles.map((article, index) => {
        const showOpener = article.section && !sectionsSeen.has(article.section);
        if (article.section) sectionsSeen.add(article.section);
        const isLead = index === 0;
        const paragraphs = articleParagraphs(article.body);
        const stat = isStatQuote(article.pull_quote);
        return (
          <div className="magazine-block" key={article.id}>
            {showOpener ? (
              <section className="section-opener">
                <span className="section-opener-num">{String(index + 1).padStart(2, "0")}</span>
                <p className="kicker">Section</p>
                <h2>{article.section}</h2>
              </section>
            ) : null}
            <section className={`magazine-article ${isLead ? "is-lead" : ""}`}>
              <header className="article-head">
                <p className="kicker">{article.section}</p>
                <h2>{article.headline}</h2>
                {article.subheadline ? <h3>{article.subheadline}</h3> : null}
                <p className="byline">By {article.byline}</p>
              </header>
              <div className="article-body">
                {stat && article.pull_quote ? (
                  <aside className="stat-callout"><strong>{article.pull_quote}</strong></aside>
                ) : null}
                {paragraphs.map((paragraph, paragraphIndex) => (
                  paragraphIndex === 1 && article.pull_quote && !stat
                    ? <div className="quote-wrap" key={`${paragraph}-q`}><blockquote className="pull-quote">{article.pull_quote}</blockquote><p>{paragraph}</p></div>
                    : <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <footer className="article-source">Sources · {article.source_note || "Chronicle Future synthesis"}</footer>
            </section>
          </div>
        );
      })}
    </article>
  );
}

function MagazinePage({ issueId, user, onBack }) {
  const [issue, setIssue] = useState(null);
  const [articles, setArticles] = useState([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    loadMagazine(issueId).then((data) => {
      if (!active) return;
      setIssue(data.issue);
      setArticles(data.articles);
    }).catch((error) => active && setMessage(error.message));
    return () => { active = false; };
  }, [issueId]);
  const updateIssue = (field) => (event) => setIssue((current) => ({ ...current, [field]: event.target.value }));
  const updateArticle = (index, field) => (event) => setArticles((current) => current.map((article, articleIndex) => articleIndex === index ? { ...article, [field]: event.target.value } : article));
  const save = async () => {
    setSaving(true);
    setMessage("");
    try { await saveMagazine(issue, articles); setMessage("Draft saved."); setEditing(false); }
    catch (error) { setMessage(error.message || "Unable to save the draft."); }
    finally { setSaving(false); }
  };
  if (!issue) return <main className="page magazine-page"><button className="text-button" onClick={onBack}>← Back to workspace</button><div className="loading-block"><span className="loading-bar" /><span className="loading-bar" /><p>{message || "Loading magazine…"}</p></div></main>;
  const canEdit = issue.user_id === user.id;
  return (
    <main className={`page magazine-page ${editing && canEdit ? "is-studio" : ""}`}>
      <div className={`studio-toolbar ${editing && canEdit ? "studio-mode" : ""}`}>
        <div className="toolbar-left">
          <button className="text-button" onClick={onBack}>← Back to workspace</button>
          {canEdit ? <span className={`status-pill status-${issue.status}`}>{issue.status}</span> : null}
          {editing && canEdit ? <span className="studio-flag">Publisher studio</span> : null}
        </div>
        <div className="toolbar-right">
          {message ? <span className="toolbar-msg">{message}</span> : null}
          {canEdit ? <button className="btn btn-outline btn-sm" onClick={() => setEditing((value) => !value)}>{editing ? "Preview" : "Edit issue"}</button> : null}
          {editing && canEdit ? <button className="btn btn-green btn-sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button> : <button className="btn btn-outline btn-sm" onClick={() => window.print()}>Print / Save PDF</button>}
        </div>
      </div>
      {editing && canEdit ? (
        <section className="magazine-editor">
          <div className="editor-heading">
            <div><p className="kicker">Issue settings</p><h1>Edit publication</h1></div>
            <label className="editor-status">Status<select value={issue.status} onChange={updateIssue("status")}><option value="draft">Draft</option><option value="review">In review</option><option value="published">Published</option></select></label>
          </div>
          <div className="editor-fields">
            <label>Title<input value={issue.title} onChange={updateIssue("title")} /></label>
            <label>Subtitle<input value={issue.subtitle} onChange={updateIssue("subtitle")} /></label>
            <label>Cover deck<textarea value={issue.dek} onChange={updateIssue("dek")} rows={3} /></label>
            <label>Editor's note<textarea value={issue.editor_note} onChange={updateIssue("editor_note")} rows={5} /></label>
          </div>
          {articles.map((article, index) => (
            <article className="article-editor" key={article.id}>
              <div className="article-editor-head"><p className="kicker">Article {String(index + 1).padStart(2, "0")}</p><h2>{article.headline || "Untitled article"}</h2></div>
              <div className="editor-grid">
                <label>Section<input value={article.section} onChange={updateArticle(index, "section")} /></label>
                <label>Status<select value={article.status} onChange={updateArticle(index, "status")}><option value="draft">Draft</option><option value="review">In review</option><option value="approved">Approved</option></select></label>
              </div>
              <label>Headline<input value={article.headline} onChange={updateArticle(index, "headline")} /></label>
              <label>Subheadline<textarea value={article.subheadline} onChange={updateArticle(index, "subheadline")} rows={2} /></label>
              <label>Article body<textarea value={article.body} onChange={updateArticle(index, "body")} rows={18} /></label>
              <label>Pull quote<textarea value={article.pull_quote} onChange={updateArticle(index, "pull_quote")} rows={3} /></label>
              <label>Source note<input value={article.source_note} onChange={updateArticle(index, "source_note")} /></label>
            </article>
          ))}
        </section>
      ) : (
        <MagazineReader issue={issue} articles={articles} />
      )}
    </main>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [view, setView] = useState("public");
  const [briefId, setBriefId] = useState(null);
  const [issueId, setIssueId] = useState(null);
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
        setIssueId(null);
      }
      setAuthReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  const home = () => { setView("public"); setBriefId(null); setIssueId(null); window.scrollTo(0, 0); };
  const workspace = () => { if (user) { setView("workspace"); setBriefId(null); setIssueId(null); window.scrollTo(0, 0); } };
  const signOut = async () => { await supabase.auth.signOut(); home(); };
  const openBrief = (id) => { setIssueId(null); setBriefId(id); window.scrollTo(0, 0); };
  const openIssue = (id) => { setBriefId(null); setIssueId(id); window.scrollTo(0, 0); };
  return (
    <>
      <style>{STYLES}</style>
      <a className="skip-link" href="#cf-content">Skip to intelligence</a>
      <Header user={user} onHome={home} onWorkspace={workspace} onSignOut={signOut} />
      <div id="cf-content" tabIndex={-1}>
        {!authReady
          ? <main className="loading-screen">Loading Chronicle Future…</main>
          : issueId ? <MagazinePage issueId={issueId} user={user} onBack={workspace} />
          : briefId ? <BriefPage briefId={briefId} onBack={workspace} />
          : view === "workspace" && user ? <Dashboard user={user} onOpenBrief={openBrief} onOpenIssue={openIssue} />
          : <PublicLanding user={user} onWorkspace={workspace} />}
      </div>
    </>
  );
}

const STYLES = `
  :root {
    /* Palette — ink, cream, powder blue, neutral */
    --ink: #18242b;
    --ink-2: #3f5059;
    --ink-3: #65747b;
    --ink-4: #7f8b91;
    --paper: #f3f4f1;
    --paper-2: #fbfcfa;
    --paper-3: #eef1ec;
    --green: #2f789f;
    --green-700: #315f78;
    --green-800: #24485c;
    --green-900: #183441;
    --green-deep: #1e465a;
    --lime: #a9dcf4;
    --lime-soft: #c5e9f8;
    --line: #d5cec2;
    --line-soft: #e2dbd0;
    --line-strong: #c7beb0;
    --up: #1f9d63;
    --up-soft: #8fe0b8;
    --down: #c2483b;
    --down-soft: #ff9e92;
    --amber: #b07a14;
    --focus: #2f789f;
    /* Type */
    --serif: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Times New Roman", serif;
    --sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    --mono: ui-monospace, "SFMono-Regular", "Cascadia Code", Menlo, Consolas, monospace;
    /* Scale */
    --maxw: 1240px;
    --gutter: clamp(16px, 4vw, 24px);
    --r: 4px;
    color: var(--ink);
    background: var(--paper);
    font-family: var(--sans);
    font-synthesis: none;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--paper); color: var(--ink); }
  button, input, textarea, select { font: inherit; color: inherit; }
  button, a { -webkit-tap-highlight-color: transparent; }
  button { cursor: pointer; }
  h1, h2, h3, p { margin-top: 0; }
  h1, h2, h3 { font-family: var(--serif); font-weight: 600; letter-spacing: -0.01em; }
  a { color: var(--green); }
  :focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; border-radius: 2px; }
  .skip-link { position: absolute; left: -9999px; top: 0; z-index: 100; background: var(--green); color: #fff; padding: 10px 16px; font-weight: 800; font-size: 13px; }
  .skip-link:focus { left: 8px; top: 8px; }
  #cf-content:focus { outline: none; }

  /* Reusable primitives */
  .page { max-width: var(--maxw); margin: auto; padding: clamp(40px, 6vw, 82px) var(--gutter); }
  .kicker { margin: 0 0 10px; color: var(--green); font-size: 11px; font-weight: 900; letter-spacing: .16em; text-transform: uppercase; }
  .kicker.light { color: var(--lime-soft); }
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 0; border-radius: var(--r); padding: 13px 18px; font-size: 14px; font-weight: 800; text-decoration: none; transition: transform .08s ease, background .15s ease, opacity .15s ease; }
  .btn:active { transform: translateY(1px); }
  .btn:disabled { opacity: .55; cursor: wait; }
  .btn-sm { padding: 9px 13px; font-size: 12px; }
  .btn-green { background: var(--green); color: #fff; }
  .btn-green:hover { background: #286789; }
  .btn-lime { background: var(--lime); color: #17303d; }
  .btn-lime:hover { background: #94cee9; }
  .btn-outline { border: 1px solid var(--green); background: transparent; color: var(--green); }
  .btn-outline:hover { background: rgba(47,120,159,.10); }
  .text-button, .text-link { border: 0; background: none; color: var(--green); padding: 0; font-size: 13px; font-weight: 800; text-decoration: none; }
  .text-button:hover, .text-link:hover { text-decoration: underline; }
  .error, .workspace-notice { color: var(--down); font-weight: 700; }
  .section-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 30px; margin-bottom: 34px; }
  .section-head.compact { margin-bottom: 22px; }
  .section-head h2 { margin: 0; font-size: clamp(28px, 4vw, 42px); }
  .section-head > p { max-width: 420px; margin: 0; color: var(--ink-3); line-height: 1.55; }
  .panel-eyebrow, .cell-eyebrow, .panel-foot { font-size: 11px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
  .cell-eyebrow { color: var(--green); margin: 0 0 14px; }
  .cell-eyebrow.up { color: var(--up); }
  .cell-eyebrow.down { color: var(--down); }

  /* Loading + skeleton */
  .loading-screen { min-height: 60vh; display: grid; place-items: center; color: var(--ink-3); }
  .loading-block { display: grid; gap: 12px; max-width: 520px; padding: 30px 0; }
  .loading-bar { height: 14px; border-radius: 3px; background: linear-gradient(90deg, var(--paper-3), #e7e0d6, var(--paper-3)); background-size: 200% 100%; animation: shimmer 1.3s linear infinite; }
  .loading-bar:nth-child(2) { width: 80%; } .loading-bar:nth-child(3) { width: 60%; }
  .loading-block p { color: var(--ink-3); }
  @keyframes shimmer { to { background-position: -200% 0; } }

  /* Data primitives */
  .meter { display: grid; grid-template-columns: 92px 1fr 38px; align-items: center; gap: 10px; margin-top: 8px; font-size: 11px; }
  .meter-label { color: var(--ink-3); font-weight: 800; text-transform: uppercase; letter-spacing: .06em; }
  .meter-track { height: 6px; border-radius: 3px; background: var(--line-soft); overflow: hidden; }
  .meter-fill { display: block; height: 100%; background: var(--green); }
  .meter-ink .meter-fill { background: var(--ink-2); }
  .meter-up .meter-fill { background: var(--up); }
  .meter-down .meter-fill { background: var(--down); }
  .meter-amber .meter-fill { background: var(--amber); }
  .meter-value { color: var(--ink); font-weight: 800; font-variant-numeric: tabular-nums; text-align: right; }
  .key-number { display: grid; gap: 2px; }
  .key-number strong { font-family: var(--serif); font-size: clamp(30px, 5vw, 46px); font-weight: 600; line-height: 1; color: var(--ink); font-variant-numeric: tabular-nums; }
  .key-number span { color: var(--ink-3); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; }
  .key-number small { color: var(--ink-4); font-size: 11px; }
  .ranked-bars { list-style: none; margin: 0; padding: 0; display: grid; gap: 11px; }
  .ranked-bars li { display: grid; grid-template-columns: 1fr 30px; align-items: center; gap: 8px; }
  .ranked-scope { grid-column: 1 / -1; color: var(--ink-2); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; }
  .ranked-track { height: 8px; border-radius: 4px; background: var(--line-soft); overflow: hidden; }
  .ranked-fill { display: block; height: 100%; background: var(--green); }
  .ranked-value { font-size: 12px; font-weight: 800; color: var(--ink); text-align: right; font-variant-numeric: tabular-nums; }
  .horizon-map { display: grid; gap: 16px; margin-top: 8px; }
  .horizon-axis { position: relative; height: 16px; border-bottom: 1px solid var(--line); }
  .horizon-axis span { position: absolute; transform: translateX(-50%); color: var(--ink-4); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; }
  .horizon-lane-label { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: .1em; }
  .horizon-up .horizon-lane-label { color: var(--up); }
  .horizon-down .horizon-lane-label { color: var(--down); }
  .horizon-track { position: relative; height: 40px; margin-top: 8px; border-left: 1px solid var(--line); }
  .horizon-track::before { content: ""; position: absolute; left: 0; right: 0; top: 50%; border-top: 1px dashed var(--line); }
  .horizon-dot { position: absolute; top: 50%; transform: translate(-50%, -50%); width: 12px; height: 12px; border-radius: 50%; }
  .horizon-up .horizon-dot { background: var(--up); }
  .horizon-down .horizon-dot { background: var(--down); }
  .horizon-dot em { position: absolute; left: 50%; top: 16px; transform: translateX(-50%); white-space: nowrap; font-style: normal; font-size: 9px; color: var(--ink-3); font-weight: 700; }

  /* Header tickers */
  .header-stack { position: sticky; top: 0; z-index: 20; }
  .market-tape { height: 34px; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; overflow: hidden; background: var(--green-900); color: #d9edf7; border-bottom: 1px solid #315b70; font-size: 11px; }
  .market-tape-label { align-self: stretch; z-index: 2; display: flex; align-items: center; gap: 8px; padding: 0 16px; padding-left: max(16px, env(safe-area-inset-left)); background: var(--green-700); white-space: nowrap; }
  .market-tape-label strong { color: var(--lime); font-size: 10px; letter-spacing: .1em; }
  .market-tape-label span { color: #a9c6d3; font-size: 9px; text-transform: uppercase; }
  .market-tape-window { min-width: 0; overflow: hidden; }
  .market-tape-track { width: max-content; display: flex; }
  .market-tape-window.is-moving .market-tape-track { animation: market-scroll 58s linear infinite; }
  .market-tape-prices .market-tape-track { animation-duration: 44s; }
  .market-tape-news { background: var(--green-800); }
  .market-tape-news .market-tape-label { background: #2b607d; }
  .market-tape-news .market-tape-label strong { color: var(--lime-soft); }
  .market-tape-news .market-tape-track { animation-duration: 78s; }
  .market-tape-news > time { background: var(--green-800); }
  .market-tape-window.is-moving:hover .market-tape-track, .market-tape-window.is-moving:focus-within .market-tape-track { animation-play-state: paused; }
  .market-tape-set { display: flex; align-items: center; gap: 28px; padding: 0 14px; white-space: nowrap; }
  .market-quote { display: flex; align-items: baseline; gap: 7px; }
  .market-quote strong { color: #f7fbfd; font-size: 10px; letter-spacing: .04em; }
  .market-quote span { color: #c8dde7; font-variant-numeric: tabular-nums; }
  .market-quote em { font-size: 10px; font-style: normal; font-variant-numeric: tabular-nums; }
  .market-quote .up { color: var(--up-soft); }
  .market-quote .down { color: var(--down-soft); }
  .market-quote .flat { color: #afc7d2; }
  .market-headline { max-width: 520px; overflow: hidden; color: #e7f2f7; text-decoration: none; text-overflow: ellipsis; }
  .market-headline small { margin-right: 8px; color: var(--up-soft); font-size: 9px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
  .market-headline:hover { color: var(--lime); }
  .market-fallback { color: #afc7d2; }
  .market-tape > time { z-index: 2; padding: 0 14px; background: var(--green-900); color: #89a8b7; font-size: 9px; font-variant-numeric: tabular-nums; }
  @keyframes market-scroll { to { transform: translateX(-50%); } }

  /* Site header */
  .site-header { height: 66px; padding: 0 max(var(--gutter), calc((100vw - var(--maxw)) / 2)); display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; border-bottom: 1px solid var(--line); background: rgba(243,244,241,.97); backdrop-filter: saturate(1.1) blur(6px); }
  .brand { border: 0; background: none; padding: 0; justify-self: start; color: var(--ink); font-weight: 900; letter-spacing: .05em; font-size: 15px; }
  .brand span { color: var(--green); }
  nav { display: flex; gap: 28px; }
  .nav-link { border: 0; background: none; color: var(--ink-2); padding: 8px 0; font-size: 14px; font-weight: 600; }
  .nav-link:hover { color: var(--green); }
  .account-button { justify-self: end; border: 1px solid var(--green-700); border-radius: var(--r); background: var(--green-700); color: #fff; padding: 10px 15px; font-size: 13px; font-weight: 700; text-decoration: none; }
  .account-button:hover { background: var(--green); }
  .account-actions { justify-self: end; display: flex; align-items: center; gap: 10px; }
  .account-identity { display: flex; align-items: center; gap: 9px; border: 0; background: transparent; color: var(--ink); padding: 5px 0; text-align: left; }
  .account-identity span:last-child { display: grid; gap: 1px; }
  .account-identity small { color: var(--ink-4); font-size: 9px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
  .account-identity strong { max-width: 150px; overflow: hidden; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
  .account-dot { width: 9px; height: 9px; border-radius: 50%; background: #20a66a; box-shadow: 0 0 0 4px rgba(32,166,106,.12); flex: none; }
  .signout-button { border: 1px solid var(--line-strong); border-radius: var(--r); background: transparent; color: var(--ink-2); padding: 8px 10px; font-size: 11px; font-weight: 800; }
  .signout-button:hover { border-color: var(--green); color: var(--green); }

  /* Public feed hero */
  .feed-hero { display: grid; grid-template-columns: 1.05fr .95fr; gap: clamp(32px, 5vw, 68px); align-items: center; max-width: var(--maxw); margin: auto; padding: clamp(40px, 6vw, 70px) var(--gutter); }
  .hero-copy h1 { max-width: 720px; margin: 0 0 24px; font-size: clamp(40px, 7vw, 72px); line-height: .98; }
  .hero-deck { max-width: 700px; margin: 0; color: var(--ink-2); font-size: clamp(17px, 2.4vw, 20px); line-height: 1.6; }
  .feed-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin-top: 30px; color: var(--ink-3); font-size: 12px; text-transform: uppercase; letter-spacing: .08em; font-weight: 700; }
  .feed-meta-date { text-transform: none; letter-spacing: 0; color: var(--ink-4); font-weight: 600; }
  .live-dot { width: 8px; height: 8px; border-radius: 50%; background: #20a66a; box-shadow: 0 0 0 4px rgba(32,166,106,.12); }
  .lead-signal { border-top: 4px solid var(--green); background: #fff; padding: clamp(24px, 4vw, 36px); box-shadow: 0 22px 60px rgba(25,42,33,.09); }
  .signal-topline { display: flex; justify-content: space-between; gap: 16px; color: var(--green); font-size: 11px; font-weight: 900; letter-spacing: .11em; text-transform: uppercase; }
  .region { margin: 14px 0 10px; color: var(--ink-4); font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
  .lead-signal h2 { margin: 0 0 16px; font-size: clamp(26px, 4vw, 38px); line-height: 1.1; }
  .lead-body, .signal-body { color: var(--ink-2); line-height: 1.65; }
  .horizon-row { display: flex; justify-content: space-between; align-items: baseline; border-top: 1px solid var(--line-soft); margin-top: 20px; padding-top: 14px; color: var(--ink-3); font-size: 12px; text-transform: uppercase; letter-spacing: .08em; font-weight: 700; }
  .horizon-row strong { color: var(--ink); }

  /* Watchlist rule */
  .watchlist { display: flex; flex-wrap: wrap; align-items: center; gap: clamp(16px, 3vw, 34px); background: var(--green-700); color: #d9edf7; padding: 14px var(--gutter); font-size: 11px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
  .watchlist-label { color: var(--lime-soft); }

  /* Major signals */
  .feed-section { max-width: var(--maxw); margin: auto; padding: clamp(48px, 7vw, 82px) var(--gutter); }
  .feed-layout { display: grid; grid-template-columns: 280px 1fr; gap: 0; border-top: 1px solid var(--line-strong); border-left: 1px solid var(--line-strong); }
  .impact-index { padding: 26px 24px; border-right: 1px solid var(--line-strong); border-bottom: 1px solid var(--line-strong); background: var(--paper-2); }
  .impact-index .panel-eyebrow { color: var(--green); margin: 0 0 18px; }
  .impact-index .panel-foot { margin: 18px 0 0; color: var(--ink-4); text-transform: none; letter-spacing: 0; font-weight: 600; }
  .feed-grid { display: grid; grid-template-columns: repeat(2, 1fr); }
  .signal-card { position: relative; min-height: 300px; display: flex; flex-direction: column; padding: 26px; border-right: 1px solid var(--line-strong); border-bottom: 1px solid var(--line-strong); background: #fff; }
  .signal-number { margin-bottom: 30px; color: var(--ink-4); font-family: var(--serif); font-size: 26px; font-variant-numeric: tabular-nums; }
  .signal-card h3 { margin: 12px 0 12px; font-size: clamp(20px, 2.4vw, 26px); line-height: 1.16; }
  .signal-card .signal-body { flex: 1; }
  .signal-card .horizon-row { margin-top: 18px; }

  /* Conversion */
  .conversion-band { padding: clamp(56px, 8vw, 88px) max(var(--gutter), calc((100vw - 1000px) / 2)); text-align: center; background: var(--green-deep); color: #fff; }
  .conversion-band h2 { margin: 0 auto 20px; max-width: 760px; font-size: clamp(32px, 5vw, 52px); }
  .conversion-band > p:not(.kicker) { max-width: 700px; margin: 0 auto 28px; color: #b9d2dd; font-size: clamp(16px, 2.2vw, 18px); line-height: 1.6; }

  /* Pricing */
  .pricing-section { max-width: 1040px; margin: 0 auto; padding: clamp(48px, 7vw, 82px) var(--gutter); }
  .pricing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; align-items: stretch; }
  .price-card { position: relative; display: flex; flex-direction: column; gap: 18px; border: 1px solid var(--line-strong); border-radius: 6px; background: #fff; padding: 32px; }
  .price-card.featured { border-color: var(--green-700); background: var(--green-700); color: #fff; }
  .price-card header h3 { display: flex; flex-direction: column; gap: 4px; margin: 0; font-family: var(--sans); }
  .price-figure { font-family: var(--serif); font-size: 46px; font-weight: 600; line-height: 1; }
  .price-unit { font-size: 13px; font-weight: 700; color: var(--ink-3); text-transform: uppercase; letter-spacing: .06em; }
  .price-card.featured .price-unit { color: #c8dde7; }
  .price-copy { margin: 0; color: var(--ink-3); line-height: 1.55; }
  .price-card.featured .price-copy { color: #d2e7f0; }
  .price-list { margin: 0; padding: 0 0 0 0; list-style: none; display: grid; gap: 8px; }
  .price-list li { position: relative; padding-left: 22px; color: var(--ink-2); font-size: 14px; line-height: 1.4; }
  .price-list li::before { content: ""; position: absolute; left: 2px; top: 7px; width: 8px; height: 8px; border-radius: 50%; background: var(--green); }
  .price-card.featured .price-list li { color: #deeff7; }
  .price-card.featured .price-list li::before { background: var(--lime); }
  .price-card .btn { margin-top: auto; }
  .price-flag { position: absolute; top: -11px; left: 24px; background: var(--lime); color: #17303d; padding: 4px 10px; border-radius: 3px; font-size: 10px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
  .pricing-error { margin: 18px 0 0; color: var(--down); font-weight: 800; text-align: center; }

  /* Auth */
  .access-band { display: grid; grid-template-columns: .9fr 1.1fr; gap: clamp(32px, 6vw, 80px); align-items: center; padding: clamp(44px, 6vw, 70px) max(var(--gutter), calc((100vw - 1100px) / 2)); background: var(--green); color: #fff; }
  .access-copy h2 { margin: 0 0 12px; font-size: clamp(28px, 4vw, 42px); }
  .access-sub { margin: 0; color: #d7eaf2; }
  .access-form label { display: block; margin-bottom: 9px; font-size: 13px; font-weight: 800; }
  .input-row { display: grid; grid-template-columns: 1fr auto; }
  .input-row input { min-width: 0; border: 0; padding: 15px; border-radius: var(--r) 0 0 var(--r); }
  .input-row .btn { border-radius: 0 var(--r) var(--r) 0; }
  .access-status { margin: 10px 0 0; color: #d7eaf2; font-size: 12px; }

  /* Workspace */
  .workspace { display: grid; gap: clamp(36px, 5vw, 54px); }
  .workspace-head { display: grid; grid-template-columns: 1fr 460px; gap: clamp(32px, 5vw, 70px); align-items: center; }
  .workspace-head h1 { margin: 0 0 18px; font-size: clamp(40px, 6vw, 68px); line-height: 1; }
  .workspace-deck { max-width: 610px; margin: 0; color: var(--ink-2); font-size: clamp(16px, 2.2vw, 18px); line-height: 1.6; }
  .plan-bar { display: flex; justify-content: space-between; align-items: center; gap: 20px; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); padding: 15px 0; }
  .plan-id { display: flex; align-items: center; gap: 12px; }
  .plan-id > div { display: grid; gap: 2px; }
  .plan-id small { color: var(--ink-4); font-size: 9px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
  .workspace-section { border: 1px solid var(--line); background: #fff; padding: clamp(22px, 3vw, 28px); }
  .location-form { display: grid; grid-template-columns: 1fr 80px 120px; gap: 14px; border: 1px solid var(--line); background: var(--paper-2); padding: clamp(20px, 3vw, 28px); }
  .location-form-head, .location-form > button, .location-form .error { grid-column: 1 / -1; }
  .location-form-head { margin-bottom: 2px; }
  .location-form-head h2 { margin: 0; font-size: 26px; }
  label { color: var(--ink-2); font-size: 12px; font-weight: 800; }
  label input, label textarea, label select { width: 100%; margin-top: 7px; border: 1px solid var(--line-strong); border-radius: 3px; padding: 11px; background: #fff; color: var(--ink); }
  .location-list { display: grid; }
  .location-row { display: flex; justify-content: space-between; gap: 24px; align-items: center; border-top: 1px solid var(--line-soft); padding: 22px 0; }
  .location-row:first-child { border-top: 0; }
  .location-id h3 { margin: 6px 0 6px; font-size: clamp(22px, 3vw, 30px); }
  .location-count { margin: 0; color: var(--ink-3); }
  .location-actions { display: flex; gap: 10px; flex: none; }
  .empty-state { padding: 40px 0 16px; color: var(--ink-3); }
  .empty-state h3 { margin: 0 0 6px; font-size: 22px; }
  .brief-list { display: grid; gap: 0; }
  .brief-row { display: grid; grid-template-columns: 1fr auto; gap: 18px; align-items: center; border-top: 1px solid var(--line-soft); }
  .brief-row:first-child { border-top: 0; }
  .brief-open { display: flex; justify-content: space-between; gap: 20px; align-items: center; border: 0; background: transparent; color: var(--ink); padding: 18px 0; text-align: left; }
  .brief-title { font-family: var(--serif); font-size: 18px; }
  .brief-open small { color: var(--ink-4); font-variant-numeric: tabular-nums; }
  .brief-open:hover .brief-title { color: var(--green); }

  /* Magazine library + publisher studio (workspace) */
  .publisher-studio { border-color: var(--green-700); border-top: 3px solid var(--green-700); background: #fbfcfd; }
  .studio-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); padding: 20px 0; margin-bottom: 8px; }
  .issue-list { display: grid; }
  .issue-row { display: flex; justify-content: space-between; gap: 24px; align-items: center; border: 0; border-top: 1px solid var(--line-soft); background: transparent; color: var(--ink); padding: 18px 0; text-align: left; }
  .issue-row:first-child { border-top: 0; }
  .issue-meta { display: grid; gap: 5px; }
  .issue-meta strong { font-family: var(--serif); font-size: 22px; font-weight: 600; }
  .issue-meta em { color: var(--ink-3); font-size: 13px; font-style: normal; }
  .issue-row:hover .issue-meta strong { color: var(--green); }
  .issue-row time { color: var(--ink-4); font-size: 12px; font-variant-numeric: tabular-nums; flex: none; }
  .status-pill { display: inline-block; width: max-content; padding: 3px 9px; border-radius: 999px; font-size: 9px; font-style: normal; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
  .status-draft { background: #ece3cf; color: #7a5a12; }
  .status-review { background: #d9e4ef; color: #285079; }
  .status-published { background: #d6efde; color: #156a3f; }
  .status-approved { background: #d6efde; color: #156a3f; }

  /* Brief page */
  .brief-page { display: grid; gap: clamp(32px, 4vw, 48px); }
  .brief-masthead { border-top: 4px solid var(--green); padding-top: 26px; }
  .brief-masthead h1 { margin: 8px 0 18px; font-size: clamp(34px, 5vw, 60px); line-height: 1.02; }
  .brief-lede { max-width: 760px; color: var(--ink-2); font-size: clamp(16px, 2.2vw, 20px); line-height: 1.6; }
  .brief-stats { display: flex; flex-wrap: wrap; gap: clamp(24px, 5vw, 56px); border-top: 1px solid var(--line); margin-top: 26px; padding-top: 22px; }
  .outlook { max-width: 820px; border-top: 1px solid var(--line); margin-top: 24px; padding-top: 18px; }
  .outlook > strong { color: var(--green); font-size: 11px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
  .outlook p { margin: 8px 0 0; color: var(--ink-2); line-height: 1.6; }
  .brief-section > .kicker { margin-bottom: 16px; }
  .brief-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; }
  .two-column { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
  .brief-cell { border: 1px solid var(--line); margin: -1px 0 0 -1px; padding: 24px; background: #fff; }
  .brief-item { border-top: 1px solid var(--line-soft); padding-top: 16px; margin-top: 16px; }
  .brief-cell > .brief-item:first-of-type { border-top: 0; padding-top: 0; margin-top: 0; }
  .brief-item h3 { margin: 0 0 6px; font-size: 20px; }
  .brief-item p { color: var(--ink-2); line-height: 1.55; margin: 0 0 6px; }
  .brief-copy { color: var(--ink-3); white-space: pre-wrap; line-height: 1.55; }
  .score-meters { margin-top: 10px; }
  .tag-row { display: flex; flex-wrap: wrap; gap: 6px; list-style: none; margin: 10px 0 0; padding: 0; }
  .tag-row li { background: var(--paper-3); color: var(--ink-2); font-size: 11px; font-weight: 700; padding: 4px 9px; border-radius: 3px; }
  .mitigation { margin-top: 8px; color: var(--ink-2); font-size: 13px; }
  .mitigation strong { color: var(--green); }
  .swot-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; }
  .swot-cell { border: 1px solid var(--line); margin: -1px 0 0 -1px; padding: 22px; background: #fff; }
  .swot-cell ul { margin: 0; padding-left: 18px; display: grid; gap: 8px; }
  .swot-cell li { color: var(--ink-2); line-height: 1.45; }
  .swot-up { border-top: 3px solid var(--up); }
  .swot-down { border-top: 3px solid var(--down); }

  /* Magazine reader */
  .magazine-page { min-height: 100vh; padding: 24px var(--gutter) 90px; }
  .studio-toolbar { position: sticky; top: 134px; z-index: 15; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; max-width: 1180px; margin: 0 auto 24px; border: 1px solid var(--line); border-radius: var(--r); background: rgba(243,244,241,.97); backdrop-filter: blur(6px); padding: 12px 16px; }
  .studio-toolbar.studio-mode { background: var(--green-deep); border-color: var(--green-800); }
  .studio-toolbar.studio-mode .text-button { color: var(--lime-soft); }
  .toolbar-left, .toolbar-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .toolbar-msg { color: var(--green); font-size: 12px; font-weight: 800; }
  .studio-mode .toolbar-msg { color: var(--lime); }
  .studio-flag { background: var(--lime); color: #17303d; padding: 3px 9px; border-radius: 3px; font-size: 9px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }

  .magazine-edition { max-width: 980px; margin: auto; background: #fff; box-shadow: 0 24px 70px rgba(19,32,25,.12); }
  .magazine-cover { background: var(--green-deep); color: #fff; }
  .cover-frame { min-height: 1040px; display: grid; grid-template-rows: auto 1fr auto auto; gap: 30px; padding: clamp(32px, 5vw, 56px); }
  .cover-top { display: flex; justify-content: space-between; align-items: center; }
  .magazine-brand { font-weight: 900; letter-spacing: .08em; }
  .magazine-brand span { color: var(--lime); }
  .cover-edition { color: #b9d2dd; font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
  .cover-asset { align-self: stretch; display: grid; place-content: center; gap: 10px; justify-items: center; border: 1px solid #315c72; background: linear-gradient(0deg, rgba(255,255,255,.02), rgba(255,255,255,.02)); }
  .cover-asset-mark { font-family: var(--serif); font-size: clamp(60px, 14vw, 130px); font-weight: 600; color: #2f637e; letter-spacing: .04em; }
  .cover-asset-note { color: #789fb2; font-size: 11px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
  .cover-headline { max-width: 780px; }
  .cover-headline h1 { margin: 12px 0 16px; font-size: clamp(48px, 9vw, 86px); line-height: .92; }
  .cover-headline h2 { margin: 0 0 14px; color: var(--lime); font-family: var(--sans); font-size: clamp(18px, 2.6vw, 22px); font-weight: 700; }
  .cover-dek { max-width: 660px; margin: 0; color: #d6e8f0; font-size: clamp(16px, 2.4vw, 19px); line-height: 1.55; }
  .cover-foot { border-top: 1px solid #54798b; padding-top: 16px; color: #afc8d3; font-size: 10px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }

  .magazine-contents { padding: clamp(40px, 6vw, 64px) clamp(34px, 6vw, 72px); border-bottom: 1px solid var(--line); }
  .toc { list-style: none; margin: 18px 0 0; padding: 0; display: grid; gap: 0; }
  .toc li { display: grid; grid-template-columns: 56px 1fr; gap: 16px; align-items: baseline; border-top: 1px solid var(--line-soft); padding: 16px 0; }
  .toc-num { font-family: var(--serif); font-size: 22px; color: var(--ink-4); font-variant-numeric: tabular-nums; }
  .toc-body { display: grid; gap: 3px; }
  .toc-body strong { font-family: var(--serif); font-size: 20px; font-weight: 600; }
  .toc-body em { color: var(--green); font-style: normal; font-size: 11px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }

  .editor-note { background: var(--paper-3); padding: clamp(44px, 6vw, 70px) clamp(34px, 6vw, 72px); }
  .editor-note h2 { margin: 0 0 18px; font-size: clamp(30px, 4vw, 48px); }
  .editor-note > p:not(.kicker) { max-width: 70ch; color: var(--ink-2); font-family: var(--serif); font-size: 18px; line-height: 1.75; }
  .editor-sign { margin-top: 18px; color: var(--green); font-weight: 700; }

  .section-opener { display: grid; gap: 4px; padding: clamp(44px, 6vw, 70px) clamp(34px, 6vw, 72px); background: var(--green-deep); color: #fff; border-top: 1px solid var(--green-800); }
  .section-opener .kicker { color: var(--lime-soft); }
  .section-opener-num { font-family: var(--serif); font-size: 48px; color: #315c72; line-height: 1; }
  .section-opener h2 { margin: 4px 0 0; color: #fff; font-size: clamp(32px, 5vw, 56px); }

  .magazine-article { padding: clamp(44px, 6vw, 70px) clamp(34px, 6vw, 72px); border-top: 1px solid var(--line); }
  .magazine-block:first-of-type .magazine-article { border-top: 0; }
  .article-head { margin-bottom: 30px; }
  .article-head h2 { max-width: 18ch; margin: 10px 0 14px; font-size: clamp(34px, 5vw, 56px); line-height: 1.02; }
  .is-lead .article-head h2 { font-size: clamp(40px, 7vw, 68px); }
  .article-head h3 { max-width: 60ch; color: var(--ink-3); font-family: var(--sans); font-size: clamp(16px, 2.2vw, 19px); font-weight: 500; line-height: 1.5; }
  .byline { margin: 14px 0 0; color: var(--green); font-size: 11px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
  .article-body { max-width: 70ch; }
  .is-lead .article-body { columns: 2; column-gap: 40px; max-width: none; }
  .is-lead .article-body > * { break-inside: avoid; }
  .article-body p { margin: 0 0 18px; color: #2d3940; font-family: var(--serif); font-size: 18px; line-height: 1.75; }
  .is-lead .article-body p { font-size: 16px; }
  .quote-wrap { break-inside: avoid; }
  .pull-quote { float: right; width: 44%; margin: 6px 0 22px 36px; border-top: 4px solid var(--green); border-bottom: 1px solid var(--line-strong); padding: 18px 0; color: var(--green); font-family: var(--serif); font-size: clamp(22px, 3vw, 29px); line-height: 1.2; }
  .stat-callout { break-inside: avoid; margin: 0 0 22px; border-left: 4px solid var(--lime); background: var(--paper-3); padding: 18px 22px; }
  .stat-callout strong { display: block; font-family: var(--serif); font-size: clamp(28px, 4vw, 40px); color: var(--green); line-height: 1.1; }
  .article-source { clear: both; border-top: 1px solid var(--line-soft); margin-top: 36px; padding-top: 14px; color: var(--ink-4); font-size: 10px; letter-spacing: .08em; text-transform: uppercase; }

  /* Publisher editor */
  .magazine-editor { display: grid; gap: 18px; max-width: 980px; margin: auto; }
  .magazine-editor > .article-editor, .editor-fields, .editor-heading { border: 1px solid var(--line); background: #fff; padding: 22px; }
  .editor-heading { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; }
  .editor-heading h1 { margin: 0; font-size: clamp(34px, 5vw, 52px); }
  .editor-status { min-width: 170px; }
  .editor-fields { display: grid; gap: 16px; }
  .magazine-editor label { display: grid; gap: 8px; }
  .magazine-editor input, .magazine-editor textarea, .magazine-editor select { width: 100%; border: 1px solid var(--line-strong); border-radius: 3px; background: var(--paper-2); padding: 11px; color: var(--ink); line-height: 1.55; }
  .magazine-editor textarea { font-family: var(--serif); }
  .article-editor { display: grid; gap: 14px; }
  .article-editor-head h2 { margin: 0; font-size: clamp(24px, 3vw, 32px); }
  .editor-grid { display: grid; grid-template-columns: 1fr 200px; gap: 14px; }

  /* Responsive */
  @media (max-width: 1080px) {
    .feed-layout { grid-template-columns: 1fr; }
    .impact-index { border-right: 0; }
  }
  @media (max-width: 900px) {
    .site-header { grid-template-columns: 1fr auto; } nav { display: none; }
    .feed-hero, .workspace-head, .access-band, .pricing-grid { grid-template-columns: 1fr; }
    .feed-grid { grid-template-columns: 1fr; }
    .brief-grid, .two-column, .swot-grid { grid-template-columns: 1fr; }
    .brief-row { grid-template-columns: 1fr; gap: 0; }
    .studio-stats { grid-template-columns: 1fr 1fr; }
    .editor-grid { grid-template-columns: 1fr; }
    .is-lead .article-body { columns: auto; }
    .pull-quote { float: none; width: auto; margin: 24px 0; }
    .studio-toolbar { position: static; }
  }
  @media (max-width: 520px) {
    .market-tape { grid-template-columns: auto minmax(0, 1fr); }
    .market-tape-label { padding: 0 10px; }
    .market-tape-label span, .market-tape > time { display: none; }
    .market-tape-prices .market-tape-track { animation-duration: 42s; }
    .market-tape-news .market-tape-track { animation-duration: 68s; }
    .account-button { padding: 9px 10px; font-size: 11px; } .brand { font-size: 12px; }
    .account-identity small, .signout-button { display: none; }
    .account-identity strong { max-width: 105px; font-size: 12px; }
    .workspace-head { gap: 26px; }
    .location-row, .location-actions { display: grid; }
    .location-actions { grid-template-columns: 1fr; gap: 8px; }
    .input-row { grid-template-columns: 1fr; }
    .input-row input { border-radius: var(--r) var(--r) 0 0; }
    .input-row .btn { border-radius: 0 0 var(--r) var(--r); }
    .studio-stats { grid-template-columns: 1fr; }
    .brief-stats { gap: 22px; }
    .meter { grid-template-columns: 76px 1fr 32px; }
  }

  /* Print / PDF */
  @media print {
    @page { size: letter; margin: .55in; }
    :root { background: #fff; }
    body { background: #fff; }
    .header-stack, .studio-toolbar, .skip-link { display: none !important; }
    .magazine-page { padding: 0; }
    .magazine-edition { max-width: none; box-shadow: none; }
    .magazine-cover { break-after: page; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .cover-frame { min-height: 9.4in; }
    .magazine-contents { break-after: page; }
    .editor-note { break-after: page; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .section-opener { break-before: page; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .magazine-block { break-before: page; }
    .magazine-block:first-of-type { break-before: auto; }
    .magazine-article { padding: 0; border: 0; }
    .article-head h2, .is-lead .article-head h2 { font-size: 38px; }
    .article-body, .is-lead .article-body { columns: auto; max-width: none; }
    .article-body p, .is-lead .article-body p { font-size: 12px; line-height: 1.55; }
    .pull-quote { font-size: 20px; }
    .stat-callout strong { font-size: 26px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .market-tape-window.is-moving .market-tape-track { animation: none; }
    .market-tape-window { overflow-x: auto; }
    .loading-bar { animation: none; }
    .btn:active { transform: none; }
  }
`;
