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
const AUTH_REDIRECT_URL = "https://chroniclefuture.com";

const displayDate = (value) => new Date(value || Date.now()).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

async function loadDashboardData(userId) {
  const [{ data: locations, error: locationError }, { data: briefs, error: briefError }, { data: issues, error: issueError }, { data: entitlement, error: entitlementError }] = await Promise.all([
    supabase.from("cf_locations").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("cf_briefs").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("cf_magazine_issues").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
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
      <div className="section-title">
        <div><p className="kicker">Private intelligence</p><h2>Choose how you use Chronicle Future</h2></div>
        <p>Start with one decision-ready brief or maintain a weekly view of the forces shaping your location.</p>
      </div>
      <div className="pricing-grid">
        <article className="price-card">
          <p className="kicker">One-time</p>
          <h3><span>$19</span> per brief</h3>
          <p>One complete location intelligence brief with signals, opportunity scoring, risks, SWOT, and decade outlook.</p>
          <button className="outline" onClick={() => checkout("one_time")} disabled={!!loading}>{loading === "one_time" ? "Opening checkout..." : user ? "Buy one brief" : "Sign in to purchase"}</button>
        </article>
        <article className="price-card featured">
          <p className="kicker light">Monthly intelligence</p>
          <h3><span>$39</span> per month</h3>
          <p>Four briefs every billing period, weekly monitoring, saved history, and continuing access to your location workspace.</p>
          <button onClick={() => checkout("monthly")} disabled={!!loading}>{loading === "monthly" ? "Opening checkout..." : user ? "Start monthly access" : "Sign in to subscribe"}</button>
        </article>
      </div>
      {error ? <p className="pricing-error">{error}</p> : null}
    </section>
  );
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
      <div>
        <p className="kicker light">Your strategic layer</p>
        <h2>See what global change means for your location.</h2>
      </div>
      <form className="access-form" onSubmit={submit}>
        <label htmlFor="email">Work email</label>
        <div className="input-row">
          <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required />
          <button disabled={loading || cooldown > 0}>{loading ? "Sending..." : cooldown ? `Resend in ${cooldown}s` : "Continue"}</button>
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
      <PricingSection user={user} />
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
  const magazineAccess = entitlement?.plan === "owner" || (entitlement?.plan === "monthly" && entitlement?.status === "active");
  return (
    <main className="workspace">
      <section className="workspace-head"><div><p className="kicker">Private intelligence workspace</p><h1>Your locations</h1><p>Turn global change into local risks, opportunities, SWOT, and forward scenarios.</p></div><LocationForm userId={user.id} onCreated={refresh} /></section>
      <section className="plan-bar"><div><span className="account-dot" /><div><small>Current access</small><strong>{allowance}</strong></div></div>{entitlement?.stripe_customer_id ? <button className="text-button" onClick={openBillingPortal}>Manage billing</button> : entitlement?.plan !== "owner" ? <a href="#workspace-pricing">View pricing</a> : null}</section>
      {message ? <p className="workspace-notice">{message}</p> : null}
      <section className="workspace-section"><div className="section-title"><div><p className="kicker">Coverage</p><h2>Location portfolio</h2></div><button className="text-button" onClick={refresh}>{loading ? "Refreshing..." : "Refresh"}</button></div>
        <div className="location-list">
          {locations.map((location) => <article className="location-row" key={location.id}><div><p className="region">{location.zip}</p><h3>{location.city}, {location.state}</h3><p>{briefsByLocation[location.id]?.length || 0} intelligence briefs</p></div><div className="location-actions"><button className="outline" onClick={() => run("ingest", location.id)} disabled={!!busy}>{busy === `ingest:${location.id}` ? "Ingesting..." : "Refresh signals"}</button><button onClick={() => run("generate", location.id)} disabled={!!busy}>{busy === `generate:${location.id}` ? "Generating..." : "Generate brief"}</button></div></article>)}
          {!locations.length && !loading ? <div className="empty-state"><h3>No locations yet</h3><p>Add the first place you want Chronicle Future to monitor.</p></div> : null}
        </div>
      </section>
      {briefs.length ? <section className="workspace-section"><div className="section-title"><div><p className="kicker">Archive</p><h2>Recent briefs</h2></div><p>Open the analysis or turn it into an editable four-article publication.</p></div><div className="brief-list">{briefs.map((brief) => <article className="brief-row" key={brief.id}><button className="brief-open" onClick={() => onOpenBrief(brief.id)}><span>{brief.title || (brief.week_of ? `Weekly intelligence: ${displayDate(brief.week_of)}` : "Intelligence brief")}</span><small>{displayDate(brief.created_at)}</small></button>{magazineAccess ? <button className="magazine-button" onClick={() => createMagazine(brief.id)} disabled={!!busy}>{busy === `magazine:${brief.id}` ? "Writing issue..." : "Produce magazine"}</button> : null}</article>)}</div></section> : null}
      <section className="workspace-section magazine-library"><div className="section-title"><div><p className="kicker">Claude production desk</p><h2>Magazine studio</h2></div><p>Evidence-led editions created from your saved intelligence, ready for review and print.</p></div>{issues.length ? <div className="issue-list">{issues.map((issue) => <button key={issue.id} onClick={() => onOpenIssue(issue.id)}><span><small>{issue.status}</small><strong>{issue.title}</strong><em>{issue.subtitle}</em></span><time>{displayDate(issue.edition_date)}</time></button>)}</div> : <div className="empty-state"><h3>No magazine issues yet</h3><p>{magazineAccess ? "Choose Produce magazine beside any intelligence brief." : "Magazine production is available with monthly access."}</p></div>}</section>
      {entitlement?.plan !== "owner" ? <div id="workspace-pricing"><PricingSection user={user} /></div> : null}
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
    <main className="workspace brief-page"><button className="text-button" onClick={onBack}>Back to locations</button><section className="brief-masthead"><p className="kicker">Weekly intelligence brief · {displayDate(brief.week_of || brief.created_at)}</p><h1>{brief.title || "Location intelligence"}</h1><p>{brief.summary || brief.decade_outlook || "A structured view of the signals shaping this location."}</p>{brief.decade_outlook ? <div className="outlook"><strong>Decade outlook</strong><p>{brief.decade_outlook}</p></div> : null}</section>
      <section className="brief-grid">{SIGNAL_GROUPS.map((group) => { const field = BRIEF_FIELDS[group]; const matching = brief.signals.filter((signal) => (signal.signal_type || "").toLowerCase() === group.toLowerCase()); return <article key={group}><p className="kicker">{group}</p>{matching.length ? matching.map((signal) => <div className="brief-item" key={signal.id}><h3>{signal.title}</h3><p>{signal.summary}</p>{signal.score ? <small>Impact {signal.score.impact_score} · Confidence {signal.score.confidence_score} · Urgency {signal.score.urgency_score}</small> : null}</div>) : <p className="brief-copy">{brief[field] || "No signal persisted for this scope."}</p>}</article>; })}</section>
      <section className="two-column"><article><p className="kicker">Opportunities</p>{brief.opportunities.map((item) => <div className="brief-item" key={item.id}><h3>{item.title}</h3><p>{item.description}</p><small>Score {item.opportunity_score} · Confidence {item.confidence_level} · {item.capital_requirement} capital · {item.time_horizon}</small></div>)}</article><article><p className="kicker">Risks</p>{brief.risks.map((item) => <div className="brief-item" key={item.id}><h3>{item.title}</h3><p>{item.description}</p><small>Risk {item.risk_score} · {item.severity} severity · {item.time_horizon}</small>{item.mitigation ? <p><strong>Mitigation:</strong> {item.mitigation}</p> : null}</div>)}</article></section>
      <section className="swot-grid">{["strengths", "weaknesses", "opportunities", "threats"].map((key) => <article key={key}><p className="kicker">{key}</p><ul>{(Array.isArray(brief.swot[key]) ? brief.swot[key] : []).map((item) => <li key={item}>{item}</li>)}</ul></article>)}</section>
    </main>
  );
}

const articleParagraphs = (body) => String(body || "").split(/\n\s*\n/).filter(Boolean);

function MagazinePage({ issueId, onBack }) {
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
  if (!issue) return <main className="workspace"><button className="text-button" onClick={onBack}>Back to workspace</button><p>{message || "Loading magazine studio..."}</p></main>;
  return (
    <main className="magazine-page">
      <div className="studio-toolbar"><button className="text-button" onClick={onBack}>Back to workspace</button><div><span>{message}</span><button className="outline" onClick={() => setEditing((value) => !value)}>{editing ? "Preview" : "Edit issue"}</button>{editing ? <button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save changes"}</button> : <button onClick={() => window.print()}>Print / Save PDF</button>}</div></div>
      {editing ? (
        <section className="magazine-editor">
          <div className="editor-heading"><p className="kicker">Issue settings</p><h1>Edit publication</h1><label>Status<select value={issue.status} onChange={updateIssue("status")}><option value="draft">Draft</option><option value="review">In review</option><option value="published">Published</option></select></label></div>
          <label>Title<input value={issue.title} onChange={updateIssue("title")} /></label>
          <label>Subtitle<input value={issue.subtitle} onChange={updateIssue("subtitle")} /></label>
          <label>Cover deck<textarea value={issue.dek} onChange={updateIssue("dek")} rows={3} /></label>
          <label>Editor's note<textarea value={issue.editor_note} onChange={updateIssue("editor_note")} rows={5} /></label>
          {articles.map((article, index) => <article className="article-editor" key={article.id}><div><p className="kicker">Article {index + 1}</p><h2>{article.headline || "Untitled article"}</h2></div><label>Section<input value={article.section} onChange={updateArticle(index, "section")} /></label><label>Headline<input value={article.headline} onChange={updateArticle(index, "headline")} /></label><label>Subheadline<textarea value={article.subheadline} onChange={updateArticle(index, "subheadline")} rows={2} /></label><label>Article body<textarea value={article.body} onChange={updateArticle(index, "body")} rows={18} /></label><label>Pull quote<textarea value={article.pull_quote} onChange={updateArticle(index, "pull_quote")} rows={3} /></label><label>Source note<input value={article.source_note} onChange={updateArticle(index, "source_note")} /></label></article>)}
        </section>
      ) : (
        <article className="magazine-edition">
          <section className="magazine-cover"><div className="magazine-brand">CHRONICLE <span>FUTURE</span></div><p className="magazine-date">Intelligence edition · {displayDate(issue.edition_date)}</p><div><p className="kicker">{issue.status}</p><h1>{issue.title}</h1><h2>{issue.subtitle}</h2><p>{issue.dek}</p></div><footer>Location intelligence · Strategy · Opportunity</footer></section>
          <section className="editor-note"><p className="kicker">From the editor</p><h2>Why this issue matters</h2>{articleParagraphs(issue.editor_note).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>
          {articles.map((article, index) => <section className="magazine-article" key={article.id}><header><p className="kicker">{article.section}</p><span>0{index + 1}</span><h2>{article.headline}</h2><h3>{article.subheadline}</h3><p className="byline">By {article.byline}</p></header>{articleParagraphs(article.body).map((paragraph, paragraphIndex) => paragraphIndex === 1 && article.pull_quote ? <div key={`${paragraph}-quote`}><blockquote>{article.pull_quote}</blockquote><p>{paragraph}</p></div> : <p key={paragraph}>{paragraph}</p>)}<footer>Sources: {article.source_note || "Chronicle Future synthesis"}</footer></section>)}
        </article>
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
  return <><style>{STYLES}</style><Header user={user} onHome={home} onWorkspace={workspace} onSignOut={signOut} />{!authReady ? <main className="loading-screen">Loading Chronicle Future...</main> : issueId ? <MagazinePage issueId={issueId} onBack={workspace} /> : briefId ? <BriefPage briefId={briefId} onBack={workspace} /> : view === "workspace" && user ? <Dashboard user={user} onOpenBrief={openBrief} onOpenIssue={openIssue} /> : <PublicLanding user={user} onWorkspace={workspace} />}</>;
}

const STYLES = `
  :root { color: #121a21; background: #f3f4f1; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-synthesis: none; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #f3f4f1; }
  button, input, textarea, select { font: inherit; }
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
  .pricing-section { max-width: 1040px; margin: 0 auto; padding: 82px 24px; }
  .pricing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .price-card { display: grid; align-content: start; border: 1px solid #bfc7c0; border-radius: 6px; background: #fff; padding: 32px; }
  .price-card.featured { border-color: #173e30; background: #173e30; color: #fff; }
  .price-card h3 { margin-bottom: 18px; font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 17px; font-weight: 700; }
  .price-card h3 span { display: block; margin-bottom: 4px; font-family: Georgia, serif; font-size: 46px; font-weight: 500; }
  .price-card > p:not(.kicker) { min-height: 78px; color: #5f6b63; line-height: 1.55; }
  .price-card.featured > p:not(.kicker) { color: #c5d5cd; }
  .price-card button { border: 0; border-radius: 4px; background: #c8f05a; color: #142019; padding: 13px 17px; font-weight: 900; }
  .price-card .outline { border: 1px solid #176b4d; background: transparent; color: #176b4d; }
  .price-card button:disabled { opacity: .55; cursor: wait; }
  .pricing-error { margin: 18px 0 0; color: #9f2f25; font-weight: 800; text-align: center; }
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
  .plan-bar { display: flex; justify-content: space-between; align-items: center; gap: 20px; border-top: 1px solid #c8cec8; border-bottom: 1px solid #c8cec8; padding: 15px 0; }
  .plan-bar > div { display: flex; align-items: center; gap: 12px; }
  .plan-bar > div > div { display: grid; gap: 2px; }
  .plan-bar small { color: #758078; font-size: 9px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
  .plan-bar a { color: #176b4d; font-size: 13px; font-weight: 800; }
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
  .brief-row { display: grid; grid-template-columns: 1fr auto; gap: 18px; align-items: center; border-top: 1px solid #d7dcd7; }
  .brief-open { display: flex; justify-content: space-between; gap: 20px; border: 0; background: transparent; color: #17231d; padding: 18px 0; text-align: left; }
  .magazine-button { border: 1px solid #176b4d; border-radius: 3px; background: transparent; color: #176b4d; padding: 10px 14px; font-size: 12px; font-weight: 900; }
  .magazine-button:disabled { opacity: .55; cursor: wait; }
  .issue-list { display: grid; }
  .issue-list > button { display: flex; justify-content: space-between; gap: 24px; align-items: center; border: 0; border-top: 1px solid #d7dcd7; background: transparent; color: #17231d; padding: 20px 0; text-align: left; }
  .issue-list > button > span { display: grid; gap: 4px; }
  .issue-list small { color: #176b4d; font-size: 9px; font-style: normal; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
  .issue-list strong { font-family: Georgia, serif; font-size: 24px; font-weight: 500; }
  .issue-list em, .issue-list time { color: #6c766f; font-size: 12px; font-style: normal; }
  .brief-grid { display: grid; grid-template-columns: repeat(3, 1fr); }
  .brief-grid > article, .two-column > article, .swot-grid > article { margin: -1px 0 0 -1px; min-height: 240px; }
  .brief-item { border-top: 1px solid #d7dcd7; padding-top: 16px; margin-top: 16px; }
  .brief-item h3 { font-size: 22px; }
  .brief-item p, .brief-grid p, .two-column p, .swot-grid li { color: #59655e; line-height: 1.55; }
  .brief-item small { color: #176b4d; font-size: 11px; font-weight: 800; text-transform: capitalize; }
  .brief-copy { white-space: pre-wrap; }
  .outlook { max-width: 780px; border-top: 1px solid #c8cec8; margin-top: 28px; padding-top: 20px; }
  .outlook > strong { color: #176b4d; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; }
  .outlook p { margin: 8px 0 0; }
  .two-column { display: grid; grid-template-columns: 1fr 1fr; }
  .swot-grid { display: grid; grid-template-columns: repeat(4, 1fr); }
  .magazine-page { min-height: 100vh; padding: 32px 24px 90px; }
  .studio-toolbar { position: sticky; top: 66px; z-index: 15; display: flex; justify-content: space-between; align-items: center; gap: 20px; max-width: 1160px; margin: 0 auto 24px; border: 1px solid #c8cec8; background: rgba(243,244,241,.97); padding: 14px 18px; }
  .studio-toolbar > div { display: flex; align-items: center; gap: 10px; }
  .studio-toolbar span { color: #176b4d; font-size: 12px; font-weight: 800; }
  .studio-toolbar > div button { border: 0; border-radius: 3px; background: #176b4d; color: #fff; padding: 10px 14px; font-weight: 800; }
  .studio-toolbar > div .outline { border: 1px solid #176b4d; background: transparent; color: #176b4d; }
  .magazine-editor { display: grid; gap: 18px; max-width: 980px; margin: auto; }
  .magazine-editor > label, .article-editor { border: 1px solid #c8cec8; background: #fff; padding: 22px; }
  .magazine-editor label { display: grid; gap: 8px; }
  .magazine-editor input, .magazine-editor textarea, .magazine-editor select { width: 100%; border: 1px solid #b8c0ba; border-radius: 3px; background: #fbfcfa; padding: 11px; color: #17231d; line-height: 1.55; }
  .editor-heading { display: flex; justify-content: space-between; align-items: end; gap: 24px; padding: 22px 0; }
  .editor-heading h1 { margin-bottom: 0; font-size: 52px; }
  .editor-heading label { min-width: 170px; }
  .article-editor { display: grid; gap: 16px; margin-top: 18px; }
  .article-editor h2 { margin-bottom: 0; font-size: 34px; }
  .magazine-edition { max-width: 980px; margin: auto; background: #fff; box-shadow: 0 24px 70px rgba(19,32,25,.12); }
  .magazine-cover { min-height: 1080px; display: grid; grid-template-rows: auto auto 1fr auto; background: #132b22; color: #fff; padding: 54px; }
  .magazine-brand { font-weight: 900; letter-spacing: .08em; }
  .magazine-brand span { color: #c8f05a; }
  .magazine-date { margin-top: 20px; color: #b9c9c1; font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
  .magazine-cover > div:nth-of-type(2) { align-self: end; max-width: 780px; padding-bottom: 70px; }
  .magazine-cover h1 { margin-bottom: 22px; font-size: 86px; line-height: .92; }
  .magazine-cover h2 { color: #c8f05a; font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 22px; font-weight: 700; }
  .magazine-cover > div:nth-of-type(2) > p:last-child { max-width: 660px; color: #d1ddd7; font-size: 19px; line-height: 1.55; }
  .magazine-cover footer { border-top: 1px solid #486158; padding-top: 18px; color: #aebfb7; font-size: 10px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
  .editor-note, .magazine-article { padding: 70px 72px; }
  .editor-note { background: #eaf0eb; }
  .editor-note h2 { font-size: 48px; }
  .editor-note > p:not(.kicker), .magazine-article > p, .magazine-article > div > p { color: #35453d; font-family: Georgia, serif; font-size: 18px; line-height: 1.75; }
  .magazine-article { border-top: 1px solid #c8cec8; }
  .magazine-article header { display: grid; grid-template-columns: 1fr auto; margin-bottom: 38px; }
  .magazine-article header > span { grid-column: 2; grid-row: 1 / 5; color: #d7ddd8; font-family: Georgia, serif; font-size: 76px; }
  .magazine-article h2, .magazine-article h3, .magazine-article .byline { grid-column: 1; }
  .magazine-article h2 { max-width: 720px; margin-bottom: 18px; font-size: 58px; line-height: 1; }
  .magazine-article h3 { max-width: 680px; color: #5c6861; font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 18px; line-height: 1.5; }
  .magazine-article .byline { color: #176b4d; font-size: 11px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
  .magazine-article blockquote { float: right; width: 42%; margin: 8px 0 24px 38px; border-top: 4px solid #176b4d; border-bottom: 1px solid #9aa79f; padding: 20px 0; color: #176b4d; font-family: Georgia, serif; font-size: 29px; line-height: 1.2; }
  .magazine-article footer { clear: both; border-top: 1px solid #d5dad6; margin-top: 42px; padding-top: 14px; color: #778179; font-size: 10px; letter-spacing: .08em; text-transform: uppercase; }
  @media (max-width: 900px) {
    .site-header { grid-template-columns: 1fr auto; padding: 0 16px; } nav { display: none; }
    .feed-hero, .workspace-head, .access-band, .pricing-grid { grid-template-columns: 1fr; gap: 34px; }
    .feed-hero { padding-top: 46px; } .hero-copy h1, .workspace-head h1, .brief-masthead h1 { font-size: 48px; }
    .ticker { justify-content: flex-start; overflow-x: auto; }
    .feed-grid { grid-template-columns: 1fr; } .signal-card, .signal-card:nth-child(4), .signal-card:nth-child(5) { grid-column: auto; min-height: 0; }
    .signal-number { margin-bottom: 34px; } .section-title, .location-row { display: grid; }
    .location-form { grid-template-columns: 1fr; } .location-form > * { grid-column: 1 !important; }
    .brief-grid, .two-column, .swot-grid { grid-template-columns: 1fr; }
    .brief-row { grid-template-columns: 1fr; gap: 0; padding-bottom: 16px; }
    .studio-toolbar { position: static; align-items: start; }
    .studio-toolbar, .studio-toolbar > div { flex-wrap: wrap; }
    .magazine-cover { min-height: 820px; padding: 34px; }
    .magazine-cover h1 { font-size: 58px; }
    .editor-note, .magazine-article { padding: 44px 34px; }
    .magazine-article h2 { font-size: 42px; }
    .magazine-article blockquote { float: none; width: auto; margin: 28px 0; }
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
  @media print {
    @page { size: letter; margin: .55in; }
    body { background: #fff; }
    .site-header, .studio-toolbar { display: none !important; }
    .magazine-page { padding: 0; }
    .magazine-edition { max-width: none; box-shadow: none; }
    .magazine-cover { min-height: 9.9in; break-after: page; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .editor-note { break-after: page; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .magazine-article { break-before: page; padding: 0; border: 0; }
    .magazine-article h2 { font-size: 44px; }
    .magazine-article > p, .magazine-article > div > p { font-size: 13px; line-height: 1.55; }
    .magazine-article blockquote { font-size: 22px; }
  }
`;
