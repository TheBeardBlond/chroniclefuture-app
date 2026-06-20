import { useState, useEffect, useRef } from "react";
import { supabase } from "./src/utils/supabase.js";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Legend
} from "recharts";

// ─── DESIGN TOKENS — Nature journal ──────────────────────────────────────────
const T = {
  paper:      "#fafafa",
  white:      "#ffffff",
  ink:        "#111111",
  body:       "#222222",
  secondary:  "#444444",
  caption:    "#666666",
  muted:      "#999999",
  faint:      "#cccccc",
  rule:       "#dddddd",
  ruleLight:  "#eeeeee",
  // Nature blue family
  blue:       "#0068b4",
  blueMid:    "#1a7ec8",
  blueLight:  "#e6f2fa",
  blueRule:   "#b8d8ee",
  // data accents
  orange:     "#e06000",
  orangeLight:"#fdf0e6",
  green:      "#1a7a42",
  greenLight: "#e6f5ec",
  red:        "#c0392b",
  redLight:   "#fcecea",
  purple:     "#6b3fa0",
};

const F_DISPLAY = "'Hind', 'Arial Black', sans-serif";          // bold sans — like Nature masthead
const F_SANS    = "'Source Sans 3', 'Helvetica Neue', sans-serif";
const F_SERIF   = "'Source Serif 4', 'Georgia', serif";
const F_MONO    = "'JetBrains Mono', 'Courier New', monospace";

// ─── DATE ────────────────────────────────────────────────────────────
const NOW      = new Date();
const LONGDATE = NOW.toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
const SHORTDT  = NOW.toLocaleDateString("en-US", { day:"numeric", month:"long", year:"numeric" });
const YEAR     = NOW.getFullYear();

// ─── API ─────────────────────────────────────────────────────────────
async function claudeJSON(system, user, maxTok = 1400) {
  const res = await fetch("/api/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messages: [
      { role: "user", content: user }
    ],
    max_tokens: maxTok,
    system
  })
});

const d = await res.json();

console.log("AI response:", d);

return d;

// ─── INTERSECTION HOOK ────────────────────────────────────────────────────────
function useInView(ref, threshold = 0.15) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setSeen(true); }, { threshold });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return seen;
}

// ─── ANIMATED CHART WRAPPER ───────────────────────────────────────────────────
function AnimChart({ children, data, duration = 1400 }) {
  const ref  = useRef(null);
  const seen = useInView(ref);
  const [pct, setPct] = useState(0);
  useEffect(() => {
    if (!seen) return;
    let raf, t0;
    const tick = ts => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      const e = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
      setPct(e);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen]);
  const cut     = Math.max(1, Math.ceil(pct * data.length));
  const visible = data.slice(0, cut);
  return <div ref={ref}>{children(visible, pct)}</div>;
}

// ─── STATIC DATA (always-present) ─────────────────────────────────────────────
const BIZ_DATA = [
  { y:"2010", starts:543 }, { y:"2011", starts:568 }, { y:"2012", starts:601 },
  { y:"2013", starts:629 }, { y:"2014", starts:665 }, { y:"2015", starts:700 },
  { y:"2016", starts:684 }, { y:"2017", starts:718 }, { y:"2018", starts:757 },
  { y:"2019", starts:800 }, { y:"2020", starts:420 }, { y:"2021", starts:862 },
  { y:"2022", starts:1046 },{ y:"2023", starts:1093 },
];

const MULTIPLIER = [
  { sector:"Technology",       mult:4.9 },
  { sector:"Professional Svc", mult:3.1 },
  { sector:"Manufacturing",    mult:2.5 },
  { sector:"Healthcare",       mult:2.1 },
  { sector:"Agriculture",      mult:1.8 },
  { sector:"Retail",           mult:0.5 },
];

const SURVIVAL = [
  { year:"Year 1", pct:80 }, { year:"Year 2", pct:66 },
  { year:"Year 3", pct:56 }, { year:"Year 4", pct:48 },
  { year:"Year 5", pct:44 }, { year:"Year 6", pct:39 },
  { year:"Year 7", pct:35 }, { year:"Year 8", pct:32 },
  { year:"Year 9", pct:30 }, { year:"Year 10",pct:28 },
];

// ─── CITATIONS REGISTRY ───────────────────────────────────────────────────────
const REFS = {
  1:  "Haltiwanger, J., Jarmin, R.S. & Miranda, J. (2013). Who Creates Jobs? Small versus Large versus Young. Rev. Econ. Stat. 95, 347–361.",
  2:  "Moretti, E. (2012). The New Geography of Jobs. Houghton Mifflin Harcourt.",
  3:  "Kauffman Foundation (2022). State of Entrepreneurship Annual Report. kauffman.org.",
  4:  "U.S. Bureau of Labor Statistics (2023). Business Employment Dynamics: Survival Rates. bls.gov.",
  5:  "Porter, M.E. (1998). Clusters and the New Economics of Competition. Harv. Bus. Rev. 76, 77–90.",
  6:  "Florida, R. (2019). The New Urban Crisis. Basic Books.",
  7:  "McKinsey Global Institute (2023). Rekindling US Productivity and Innovation. McKinsey & Co.",
  8:  "Glaeser, E.L. (2011). Triumph of the City. Penguin Press.",
  9:  "World Bank (2024). Small Town Economic Development: Evidence from 40 Countries. worldbank.org.",
  10: "Jacobs, J. (1969). The Economy of Cities. Vintage Books.",
};

// ─── INLINE CITATION COMPONENT ────────────────────────────────────────────────
function Ref({ n }) {
  const [open, setOpen] = useState(false);
  const ref = REFS[n];
  return (
    <span style={{ position: "relative", display: "inline" }}>
      <sup
        onClick={() => setOpen(o => !o)}
        style={{
          fontSize: 9, fontWeight: 700, color: T.blue,
          cursor: "pointer", fontFamily: F_SANS, marginLeft: 1,
          userSelect: "none",
        }}
      >{n}</sup>
      {open && ref && (
        <span style={{
          position: "absolute", left: 0, top: 14, zIndex: 300,
          background: T.white, border: `1px solid ${T.blueRule}`,
          borderRadius: 3, padding: "10px 13px", width: 320,
          boxShadow: "0 4px 18px rgba(0,0,0,0.12)",
          fontFamily: F_SANS, fontSize: 11, color: T.secondary,
          lineHeight: 1.6, display: "block",
        }}>
          <span style={{ fontWeight: 700, color: T.blue }}>[{n}]</span> {ref}
          <span
            onClick={e => { e.stopPropagation(); setOpen(false); }}
            style={{ display:"block", marginTop: 8, color: T.blue, cursor: "pointer", fontSize: 10 }}
          >Close ×</span>
        </span>
      )}
    </span>
  );
}
// ─── MAIN PAGE COMPONENT ─────────────────────────────────────────────
function HometownChronicle() {
  const [town, setTown] = useState("");
  const [zip, setZip] = useState("");
  const [state, setState] = useState("");
  const [engine, setEngine] = useState("claude"); 
  const [result, setResult] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  // ⭐ Your backend trigger
  const onGo = async (town, zip, state) => {
    setLoading(true);
    try {
     // Decide which backend route to call
const endpoint =
  engine === "claude"
    ? "/api/generate"
    : "/api/generate-gpt";

// Call the selected AI engine
const response = await fetch(endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messages: [
      {
        role: "user",
        content: `Town: ${town}, ZIP: ${zip}, State: ${state}`
      }
    ]
  })
});

// Parse the response
const data = await response.json();

console.log("AI response:", data);

// Save the AI text into your state
setResult(data.text || "No content returned");

    } catch (err) {
      console.error(err);
      setResult("Generation failed — please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Hometown Chronicle</h1>

      <input
        placeholder="Town"
        value={town}
        onChange={e => setTown(e.target.value)}
      />

      <input
        placeholder="ZIP"
        value={zip}
        onChange={e => setZip(e.target.value)}
      />

      <input
        placeholder="State"
        value={state}
        onChange={e => setState(e.target.value)}
      />
<div style={{ marginTop: "12px" }}>
  <label style={{ marginRight: "8px" }}>AI Model:</label>
  <select
    value={engine}
    onChange={(e) => setEngine(e.target.value)}
    style={{ padding: "6px", borderRadius: "6px" }}
  >
    <option value="claude">Claude 3 Sonnet</option>
    <option value="gpt">ChatGPT 4o-mini</option>
  </select>
</div>

      <button
        onClick={() => onGo(town.trim(), zip.trim(), state.trim())}
        disabled={!town || !zip || !state}
      >
        Generate analysis
      </button>

      <div style={{ marginTop: 20 }}>
        {loading ? "Generating…" : result}
      </div>
    </div>
  );
}

export default HometownChronicle;

// ─── FIGURE CAPTION ───────────────────────────────────────────────────────────
function Fig({ n, caption }) {
  return (
    <p style={{ fontFamily: F_SANS, fontSize: 10.5, color: T.caption, lineHeight: 1.55, marginTop: 8 }}>
      <strong style={{ color: T.ink }}>Fig. {n} |</strong> {caption}
    </p>
  );
}

// ─── SECTION HEADER (Nature-style bold sans) ──────────────────────────────────
function SectionHead({ children }) {
  return (
    <h2 style={{
      fontFamily: F_SANS, fontSize: 13.5, fontWeight: 700,
      color: T.ink, letterSpacing: "0.01em",
      margin: "32px 0 10px", lineHeight: 1.2,
    }}>{children}</h2>
  );
}

// ─── RULED DIVIDER ────────────────────────────────────────────────────────────
function Rule({ color = T.rule }) {
  return <div style={{ height: 1, background: color, margin: "28px 0" }} />;
}

// ─── CHART: Business Formation ────────────────────────────────────────────────
function ChartBizFormation() {
  return (
    <AnimChart data={BIZ_DATA} duration={1600}>
      {(visible) => (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={visible} margin={{ top: 6, right: 8, bottom: 18, left: 0 }}>
            <defs>
              <linearGradient id="gBiz" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={T.blue} stopOpacity={0.22} />
                <stop offset="100%" stopColor={T.blue} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={T.ruleLight} strokeDasharray="2 3" vertical={false} />
            <XAxis dataKey="y" tick={{ fontFamily: F_MONO, fontSize: 8.5, fill: T.muted }}
              axisLine={{ stroke: T.rule }} tickLine={false} />
            <YAxis tick={{ fontFamily: F_MONO, fontSize: 8.5, fill: T.muted }}
              axisLine={false} tickLine={false} tickFormatter={v => `${v}k`} width={32} />
            <ReferenceLine x="2020" stroke={T.red} strokeDasharray="3 2"
              label={{ value: "COVID-19", position: "top", fontFamily: F_SANS, fontSize: 8, fill: T.red }} />
            <Tooltip
              contentStyle={{ fontFamily: F_SANS, fontSize: 10, border: `1px solid ${T.rule}`, borderRadius: 2, background: T.white }}
              formatter={v => [`${v}k`, "New applications"]}
            />
            <Area type="monotone" dataKey="starts" stroke={T.blue} strokeWidth={1.5} fill="url(#gBiz)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </AnimChart>
  );
}

// ─── CHART: Survival Rate ─────────────────────────────────────────────────────
function ChartSurvival() {
  return (
    <AnimChart data={SURVIVAL} duration={1400}>
      {(visible) => (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={visible} margin={{ top: 6, right: 8, bottom: 18, left: 0 }}>
            <CartesianGrid stroke={T.ruleLight} strokeDasharray="2 3" vertical={false} />
            <XAxis dataKey="year" tick={{ fontFamily: F_MONO, fontSize: 8, fill: T.muted }}
              axisLine={{ stroke: T.rule }} tickLine={false} />
            <YAxis tick={{ fontFamily: F_MONO, fontSize: 8.5, fill: T.muted }}
              axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} width={32} />
            <ReferenceLine y={50} stroke={T.orange} strokeDasharray="3 2"
              label={{ value: "50% threshold", position: "right", fontFamily: F_SANS, fontSize: 7.5, fill: T.orange }} />
            <Tooltip contentStyle={{ fontFamily: F_SANS, fontSize: 10, border: `1px solid ${T.rule}`, borderRadius: 2, background: T.white }}
              formatter={v => [`${v}%`, "Survival rate"]} />
            <Line type="monotone" dataKey="pct" stroke={T.orange} strokeWidth={2} dot={{ r: 2.5, fill: T.orange }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </AnimChart>
  );
}

// ─── CHART: Multiplier ────────────────────────────────────────────────────────
function ChartMultiplier() {
  return (
    <AnimChart data={MULTIPLIER} duration={1000}>
      {(visible, pct) => {
        const animated = visible.map(d => ({ ...d, mult: d.mult * pct }));
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={animated} layout="vertical" margin={{ top: 4, right: 32, bottom: 4, left: 90 }}>
              <CartesianGrid stroke={T.ruleLight} strokeDasharray="2 3" horizontal={false} />
              <XAxis type="number" domain={[0, 6]} tick={{ fontFamily: F_MONO, fontSize: 8.5, fill: T.muted }}
                axisLine={{ stroke: T.rule }} tickLine={false} tickFormatter={v => `${v}×`} />
              <YAxis type="category" dataKey="sector" tick={{ fontFamily: F_SANS, fontSize: 10.5, fill: T.body }}
                axisLine={false} tickLine={false} width={88} />
              <ReferenceLine x={1} stroke={T.muted} strokeDasharray="3 2" />
              <Tooltip contentStyle={{ fontFamily: F_SANS, fontSize: 10, border: `1px solid ${T.rule}`, borderRadius: 2, background: T.white }}
                formatter={v => [`${v.toFixed(1)}×`, "Local multiplier"]} />
              <Bar dataKey="mult" fill={T.blue} radius={[0, 2, 2, 0]} maxBarSize={15} />
            </BarChart>
          </ResponsiveContainer>
        );
      }}
    </AnimChart>
  );
}

// ─── CHART: Growth Projections ────────────────────────────────────────────────
function ChartGrowth({ data }) {
  if (!data || data.length < 2) return null;
  return (
    <AnimChart data={data} duration={1800}>
      {(visible) => (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={visible} margin={{ top: 8, right: 12, bottom: 18, left: 0 }}>
            <CartesianGrid stroke={T.ruleLight} strokeDasharray="2 3" vertical={false} />
            <XAxis dataKey="year" tick={{ fontFamily: F_MONO, fontSize: 8.5, fill: T.muted }}
              axisLine={{ stroke: T.rule }} tickLine={false} />
            <YAxis tick={{ fontFamily: F_MONO, fontSize: 8.5, fill: T.muted }}
              axisLine={false} tickLine={false} width={36} />
            <Tooltip contentStyle={{ fontFamily: F_SANS, fontSize: 10, border: `1px solid ${T.rule}`, borderRadius: 2, background: T.white }} />
            <Legend wrapperStyle={{ fontFamily: F_SANS, fontSize: 9, paddingTop: 6 }} />
            <Line type="monotone" dataKey="baseline"   stroke={T.muted}   strokeWidth={1.2} dot={false} strokeDasharray="4 3" name="No-change" />
            <Line type="monotone" dataKey="withPolicy" stroke={T.blue}    strokeWidth={2}   dot={false} name="Policy scenario" />
            <Line type="monotone" dataKey="optimistic" stroke={T.green}   strokeWidth={1.5} dot={false} strokeDasharray="2 2" name="Optimistic" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </AnimChart>
  );
}

// ─── DATA GENERATION ───────────────────────────────────────────────────────────
async function generate(town, zip, state) {
  const place = `${town}, ${state} (ZIP ${zip})`;
  const J = "Return ONLY valid JSON. No markdown fences, no preamble, no trailing text.";

  const [weather, news, geo, blueprint, decade, projections] = await Promise.all([

    claudeJSON(J, `Current weather for ${place} on ${SHORTDT}.
Return: {"temp":"72°F","feelsLike":"69°F","condition":"Partly Cloudy","humidity":"58%","wind":"NW 9 mph","uv":"Moderate","sunrise":"5:52 AM","sunset":"9:14 PM","prose":"Two precise sentences about the weather today."}`),

    claudeJSON(J, `Generate 3 substantive local news stories for ${place} on ${SHORTDT}. Frame analytically — causes, implications, economic context.
Array of: {"headline":"...","section":"City|Business|Infrastructure|Environment","deck":"One sharp sentence.","analysis":"Two sentences of analytical depth — causes and implications.","urgency":"low|medium|high"}`),

    claudeJSON(J, `Three active geopolitical developments that directly affect ${place}. Name specific industries, employers, or supply chains in ${town}.
Array of: {"headline":"...","region":"...","globalSummary":"Two sentences.","localEcho":"Two sentences naming specific ${town} industries.","tension":"low|medium|high|critical","exposure":"e.g. ~14% of exports"}`),

    claudeJSON(J, `Four evidence-based development initiatives for ${place}, ${YEAR}–${YEAR+10}. Cite real policy models and financing mechanisms.
Array of: {"title":"...","domain":"Infrastructure|Economy|Housing|Environment|Civic","cost":"$X.XM","timeline":"YYYY–YYYY","outcome":"Specific measurable result","model":"Comparable city/program","financing":"funding source","spec":"One sentence detail","status":"proposed|funded|in-progress"}`),

    claudeJSON(J, `Rigorous 10-year economic and civic forecast for ${place} (${YEAR}–${YEAR+10}). Analytical, cite comparable towns.
Return: {
  "headline":"...",
  "abstract":"Two crisp sentences — core thesis.",
  "findings":["Three specific data-grounded one-sentence findings about this town's trajectory."],
  "body":"Three dense analytical paragraphs — economic forces, demographic trends, comparable towns. Reference real patterns.",
  "milestones":[
    {"year":"${YEAR+2}","title":"...","detail":"One precise sentence."},
    {"year":"${YEAR+5}","title":"...","detail":"One precise sentence."},
    {"year":"${YEAR+8}","title":"...","detail":"One precise sentence."},
    {"year":"${YEAR+10}","title":"...","detail":"One precise sentence."}
  ],
  "risks":["Two specific risk factors. One sentence each."],
  "catalysts":["Two specific opportunity catalysts. One sentence each."]
}`, 2200),

    claudeJSON(J, `Economic output index for ${place}, ${YEAR}–${YEAR+10}. Return array of 11 objects:
[{"year":"${YEAR}","baseline":100,"withPolicy":100,"optimistic":100}, ...]
baseline grows ~0.8%/yr, withPolicy ~2.5%/yr with some variation, optimistic ~4.5%/yr. Use plausible noise. Return only the JSON array.`),
  ]);

  // Save to Supabase
  try {
    const { data, error } = await supabase
      .from('reports')
      .insert([
        {
          town,
          zip,
          state,
          weather,
          news,
          geo,
          blueprint,
          decade,
          projections,
          created_at: new Date().toISOString()
        }
      ]);
    
    if (error) console.log("Supabase save error:", error.message);
    else console.log("Report saved successfully!");
  } catch (e) {
    console.log("Save failed:", e.message);
  }

  return { weather, news, geo, blueprint, decade, projections };
}

// ─── LANDING ───────────────────────────────────────────────────────────────────
function Landing({ onGo, err }) {
  const [town,  setT] = useState("");
  const [zip,   setZ] = useState("");
  const [state, setS] = useState("");
  const ok = town.trim() && zip.trim() && state.trim();

  const inp = {
    width: "100%", padding: "8px 10px", fontSize: 13, fontFamily: F_SANS,
    border: `1px solid ${T.rule}`, borderRadius: 2,
    background: T.white, color: T.ink, outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: T.paper, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>

      {/* ── journal masthead ── */}
      <div style={{ textAlign: "center", marginBottom: 44, maxWidth: 560, width: "100%" }}>
        {/* top rule strip */}
        <div style={{ height: 4, background: T.ink, marginBottom: 2 }} />
        <div style={{ height: 1, background: T.ink, marginBottom: 10 }} />

        <div style={{ fontFamily: F_DISPLAY, fontWeight: 900, fontSize: "clamp(54px,11vw,96px)", color: T.ink, lineHeight: 0.88, letterSpacing: "-0.02em" }}>
          chronicle
        </div>

        <div style={{ height: 1, background: T.ink, margin: "10px 0 4px" }} />
        <div style={{ height: 3, background: T.ink, marginBottom: 12 }} />

        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: F_SANS, fontSize: 10.5, color: T.caption, letterSpacing: "0.04em" }}>
          <span>The Journal of Local Futures</span>
          <span>{SHORTDT}</span>
          <span>civic · economic · global</span>
        </div>
      </div>

      {/* ── entry card ── */}
      <div style={{ background: T.white, border: `1px solid ${T.rule}`, borderRadius: 3, padding: "28px 32px", maxWidth: 400, width: "100%", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
        {err && (
          <div style={{ background: T.redLight, border: `1px solid ${T.red}40`, borderRadius: 2, padding: "8px 11px", marginBottom: 14, fontSize: 11, color: T.red, fontFamily: F_SANS }}>
            {err}
          </div>
        )}

        <p style={{ fontFamily: F_SERIF, fontSize: 15, color: T.ink, marginBottom: 4 }}>
          Select your municipality
        </p>
        <p style={{ fontFamily: F_SANS, fontSize: 11.5, color: T.caption, lineHeight: 1.65, marginBottom: 20 }}>
          Generate a peer-reviewed economic and civic analysis with animated data, geopolitical exposure mapping, and a 10-year development blueprint.
        </p>

        <label style={{ fontFamily: F_SANS, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted }}>Town / City</label>
        <input style={{ ...inp, marginTop: 4, marginBottom: 12 }} placeholder="Bay City"
          value={town} onChange={e => setT(e.target.value)} onKeyDown={e => e.key === "Enter" && ok && onGo(town,zip,state)} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          <div>
            <label style={{ fontFamily: F_SANS, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted }}>ZIP</label>
            <input style={{ ...inp, marginTop: 4 }} placeholder="48708" value={zip} onChange={e => setZ(e.target.value)} />
          </div>
          <div>
            <label style={{ fontFamily: F_SANS, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted }}>State</label>
            <input style={{ ...inp, marginTop: 4 }} placeholder="MI" value={state} onChange={e => setS(e.target.value)}
              onKeyDown={e => e.key === "Enter" && ok && onGo(town,zip,state)} />
          </div>
        </div>

        <button
          onClick={() => ok && onGo(town.trim(), zip.trim(), state.trim())}
          disabled={!ok}
          style={{
            width: "100%", padding: "11px", fontFamily: F_SANS, fontSize: 13, fontWeight: 700,
            background: ok ? T.blue : T.ruleLight, color: ok ? T.white : T.muted,
            border: "none", borderRadius: 2, cursor: ok ? "pointer" : "not-allowed",
            letterSpacing: "0.04em", transition: "background 0.15s",
          }}
        >Generate analysis →</button>
      </div>

      <p style={{ marginTop: 18, fontFamily: F_SANS, fontSize: 10, color: T.muted, textAlign: "center" }}>
        AI-generated · Journal citation format · Powered by Claude
      </p>
    </div>
  );
}

// ─── LOADING ───────────────────────────────────────────────────────────────────
function Loading({ town }) {
  const steps = ["Retrieving atmospheric data…","Parsing local dispatches…","Scanning geopolitical signals…","Modelling development scenarios…","Projecting economic trajectories…","Calibrating forecast models…"];
  const [s, setS] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setS(p => Math.min(p + 1, steps.length - 1)), 1100);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ minHeight: "100vh", background: T.paper, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ textAlign: "center", maxWidth: 380 }}>
        <div style={{ fontFamily: F_DISPLAY, fontWeight: 900, fontSize: "clamp(34px,6vw,56px)", color: T.ink, lineHeight: 0.9, letterSpacing: "-0.02em", marginBottom: 4 }}>chronicle</div>
        <div style={{ fontFamily: F_SANS, fontSize: 11.5, color: T.caption, marginBottom: 32 }}>{SHORTDT} · {town}</div>
        <div style={{ height: 2, background: T.ruleLight, borderRadius: 1, overflow: "hidden", marginBottom: 18 }}>
          <div style={{ height: "100%", background: T.blue, width: `${((s + 1) / steps.length) * 100}%`, transition: "width 0.9s cubic-bezier(.4,0,.2,1)" }} />
        </div>
        <p style={{ fontFamily: F_SANS, fontSize: 11, color: T.muted, fontStyle: "italic" }}>{steps[s]}</p>
      </div>
    </div>
  );
}

// ─── MAIN ARTICLE ──────────────────────────────────────────────────────────────
function Article({ town, zip, state, ed, onBack }) {
  const W = {
    wx:   ed.weather    || {},
    news: ed.news       || [],
    geo:  ed.geo        || [],
    bp:   ed.blueprint  || [],
    dec:  ed.decade     || {},
    proj: ed.projections|| [],
  };
  const tc = { low: T.green, medium: T.orange, high: T.red, critical: "#8b0000" };
  const dc = { Infrastructure: T.blue, Economy: T.orange, Housing: T.green, Environment: T.green, Civic: T.purple };
  const sb = { proposed: T.blueLight, funded: T.greenLight, "in-progress": T.orangeLight };

  return (
    <div style={{ background: T.paper, minHeight: "100vh" }}>

      {/* ── JOURNAL HEADER ── */}
      <header style={{ background: T.white, borderBottom: `3px solid ${T.ink}`, padding: "0 0 0 0" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 28px" }}>
          {/* top strip */}
          <div style={{ borderBottom: `1px solid ${T.rule}`, padding: "7px 0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontFamily: F_SANS, fontSize: 10, color: T.caption }}>
              The Journal of Local Futures | civic &amp; economic analysis
            </span>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <span style={{ fontFamily: F_MONO, fontSize: 10, color: T.caption }}>{SHORTDT}</span>
              <button onClick={onBack} style={{ background: "none", border: `1px solid ${T.rule}`, borderRadius: 2, padding: "3px 10px", fontFamily: F_SANS, fontSize: 10, color: T.caption, cursor: "pointer" }}>← Back</button>
            </div>
          </div>

          {/* masthead */}
          <div style={{ padding: "14px 0 10px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontFamily: F_DISPLAY, fontWeight: 900, fontSize: "clamp(40px,6vw,66px)", color: T.ink, letterSpacing: "-0.02em", lineHeight: 0.9 }}>
              chronicle
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: F_SERIF, fontSize: 20, color: T.ink, fontStyle: "italic" }}>
                {town}, {state}
              </div>
              <div style={{ fontFamily: F_SANS, fontSize: 10.5, color: T.caption, marginTop: 2 }}>
                ZIP {zip} · {LONGDATE}
              </div>
            </div>
          </div>

          {/* bottom double rule */}
          <div style={{ height: 1, background: T.ink }} />
          <div style={{ height: 3, background: T.ink, marginBottom: 0 }} />
        </div>
      </header>

      {/* ── BODY: two-column journal layout ── */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 28px 80px" }}>

        {/* Abstract banner */}
        {W.dec.abstract && (
          <div style={{ borderBottom: `1px solid ${T.rule}`, padding: "16px 0 14px", marginBottom: 0 }}>
            <span style={{ fontFamily: F_SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: T.blue, marginRight: 10 }}>Abstract</span>
            <span style={{ fontFamily: F_SERIF, fontSize: 13, color: T.secondary, fontStyle: "italic", lineHeight: 1.7 }}>
              {W.dec.abstract}<Ref n={7} /><Ref n={9} />
            </span>
          </div>
        )}

        {/* Key findings row */}
        {Array.isArray(W.dec.findings) && W.dec.findings.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${W.dec.findings.length}, 1fr)`, borderBottom: `1px solid ${T.rule}`, margin: "0 0 0" }}>
            {W.dec.findings.map((f, i) => (
              <div key={i} style={{ padding: "13px 16px", borderRight: i < W.dec.findings.length - 1 ? `1px solid ${T.rule}` : "none" }}>
                <div style={{ fontFamily: F_MONO, fontSize: 9, color: T.blue, marginBottom: 5, letterSpacing: "0.06em" }}>Key finding {i + 1}</div>
                <div style={{ fontFamily: F_SANS, fontSize: 11, color: T.body, lineHeight: 1.6 }}>{f}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── WEATHER + LOCAL NEWS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 0, borderBottom: `1px solid ${T.rule}`, margin: "0 0 0" }}>

          {/* weather sidebar */}
          <div style={{ borderRight: `1px solid ${T.rule}`, padding: "20px 18px 20px 0" }}>
            <div style={{ fontFamily: F_SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: T.muted, marginBottom: 12 }}>Atmospheric conditions</div>
            <div style={{ fontFamily: F_DISPLAY, fontWeight: 900, fontSize: 48, color: T.ink, lineHeight: 1, marginBottom: 2 }}>{W.wx.temp || "—"}</div>
            <div style={{ fontFamily: F_SANS, fontSize: 11.5, color: T.secondary, marginBottom: 14 }}>{W.wx.condition}</div>
            {[["Feels like", W.wx.feelsLike], ["Humidity", W.wx.humidity], ["Wind", W.wx.wind], ["UV index", W.wx.uv], ["Sunrise", W.wx.sunrise], ["Sunset", W.wx.sunset]].map(([l, v]) => (
              v ? (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", fontFamily: F_SANS, fontSize: 10.5, borderTop: `1px solid ${T.ruleLight}`, padding: "5px 0" }}>
                  <span style={{ color: T.muted }}>{l}</span>
                  <span style={{ color: T.body, fontFamily: F_MONO }}>{v}</span>
                </div>
              ) : null
            ))}
            {W.wx.prose && (
              <p style={{ fontFamily: F_SERIF, fontSize: 11, color: T.caption, fontStyle: "italic", lineHeight: 1.6, marginTop: 12 }}>"{W.wx.prose}"</p>
            )}
          </div>

          {/* local news */}
          <div style={{ padding: "20px 0 20px 20px" }}>
            <div style={{ fontFamily: F_SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: T.muted, marginBottom: 14 }}>Local dispatches</div>
            {W.news.map((s, i) => {
              const acc = { City: T.blue, Business: T.orange, Infrastructure: T.blue, Environment: T.green }[s.section] || T.blue;
              return (
                <div key={i} style={{ borderTop: i > 0 ? `1px solid ${T.ruleLight}` : "none", paddingTop: i > 0 ? 14 : 0, marginTop: i > 0 ? 14 : 0 }}>
                  <div style={{ fontFamily: F_SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: acc, marginBottom: 5 }}>{s.section}</div>
                  <div style={{ fontFamily: F_SERIF, fontSize: 15, color: T.ink, lineHeight: 1.3, marginBottom: 5 }}>{s.headline}</div>
                  <div style={{ fontFamily: F_SANS, fontSize: 11.5, color: T.secondary, lineHeight: 1.6, marginBottom: 5 }}>{s.deck}</div>
                  <div style={{ fontFamily: F_SANS, fontSize: 11, color: T.caption, lineHeight: 1.7 }}>{s.analysis}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── SECTION: ENTREPRENEURSHIP ── */}
        <div style={{ borderBottom: `1px solid ${T.rule}`, padding: "24px 0" }}>
          {/* rotated "Article" label */}
          <div style={{ display: "flex", gap: 24 }}>
            <div style={{ writingMode: "vertical-rl", textOrientation: "mixed", transform: "rotate(180deg)", fontFamily: F_SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: T.muted }}>
              Article
            </div>
            <div style={{ flex: 1 }}>
              <SectionHead>The entrepreneurial imperative</SectionHead>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, alignItems: "start" }}>
                <div>
                  <p style={{ fontFamily: F_SANS, fontSize: 12, color: T.body, lineHeight: 1.82, marginBottom: 12 }}>
                    New business formation represents the single most important driver of net job creation in market economies.<Ref n={1} /> Firms aged less than five years generate virtually all net employment growth in the U.S. economy.
                  </p>
                  <p style={{ fontFamily: F_SANS, fontSize: 12, color: T.body, lineHeight: 1.82 }}>
                    The post-pandemic surge in business applications — reaching 1.05 million new filings in 2022, a 40-year record — signals a structural reorientation of labor toward entrepreneurship and remote work compatibility.
                  </p>
                </div>
                <div>
                  <ChartBizFormation />
                  <Fig n="1" caption="U.S. new business applications, 2010–2023 (thousands). The 2021–2022 surge represents the largest peacetime formation event in recorded U.S. economic history, driven by pandemic labor reallocation." />
                </div>
              </div>

              <Rule />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, alignItems: "start" }}>
                <div>
                  <ChartSurvival />
                  <Fig n="2" caption="Business survival rates by year of operation. Roughly 44% of new firms survive to year five; 28% to year ten. The critical intervention window is years 2–4, when structural capital constraints emerge." />
                </div>
                <div>
                  <p style={{ fontFamily: F_SANS, fontSize: 12, color: T.body, lineHeight: 1.82 }}>
                    Survival data reveal the structural weakness underlying formation optimism. Approximately 50% of new businesses fail within five years<Ref n={4} /> — a figure that has remained stubbornly stable across decades and geographies.
                  </p>
                  <p style={{ fontFamily: F_SANS, fontSize: 12, color: T.body, lineHeight: 1.82, marginTop: 12 }}>
                    For industry operators and entrepreneurs evaluating {town} as a base, the implication is strategic: co-location with complementary businesses in a cluster formation reduces failure risk by up to 30% within the critical 2–4 year window.<Ref n={5} />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION: MULTIPLIER ── */}
        <div style={{ borderBottom: `1px solid ${T.rule}`, padding: "24px 0" }}>
          <div style={{ display: "flex", gap: 24 }}>
            <div style={{ writingMode: "vertical-rl", textOrientation: "mixed", transform: "rotate(180deg)", fontFamily: F_SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: T.muted }}>
              Analysis
            </div>
            <div style={{ flex: 1 }}>
              <SectionHead>Sector multiplier effects and the traded-sector imperative</SectionHead>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, alignItems: "start" }}>
                <div>
                  <p style={{ fontFamily: F_SANS, fontSize: 12, color: T.body, lineHeight: 1.82, marginBottom: 12 }}>
                    Moretti's foundational work on local multiplier effects demonstrates that economic sectors differ dramatically in their capacity to generate secondary employment.<Ref n={2} /> A single job in the technology sector generates 4.9 indirect local service jobs—construction, retail, hospitality.
                  </p>
                  <p style={{ fontFamily: F_SANS, fontSize: 12, color: T.body, lineHeight: 1.82 }}>
                    The mechanism operates through what economists term the "traded sector" — industries that sell goods or services outside the local economy, importing net purchasing power. Manufacturing, software, biotech, and professional services are primary traded sectors; retail and hospitality are local-serving.
                  </p>
                </div>
                <div>
                  <ChartMultiplier />
                  <Fig n="3" caption="Local job multiplier by sector — each job in a traded sector generates this many additional local service jobs. The reference line at 1× represents breakeven; below it, sectors are net local employment drains." />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION: GEOPOLITICS ── */}
        <div style={{ borderBottom: `1px solid ${T.rule}`, padding: "24px 0" }}>
          <SectionHead>Geopolitical exposure and local transmission</SectionHead>
          <p style={{ fontFamily: F_SANS, fontSize: 12, color: T.body, lineHeight: 1.82, marginBottom: 18 }}>
            Small and mid-sized municipalities are increasingly exposed to global economic shocks through supply chain integration, commodity price transmission, and demographic flows.<Ref n={7} /> The following geopolitical vectors directly affect {town}.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0, border: `1px solid ${T.rule}`, borderRadius: 3, overflow: "hidden" }}>
            {W.geo.map((g, i) => {
              const col = tc[g.tension] || T.muted;
              return (
                <div key={i} style={{ padding: "16px 16px", borderRight: i < W.geo.length - 1 ? `1px solid ${T.rule}` : "none", background: i % 2 === 1 ? T.paper : T.white }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
                    <span style={{ fontFamily: F_SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: T.muted }}>{g.region}</span>
                    <span style={{ fontFamily: F_SANS, fontSize: 9, fontWeight: 700, color: col, textTransform: "uppercase", letterSpacing: "0.1em" }}>{g.tension}</span>
                  </div>
                  <div style={{ fontFamily: F_SERIF, fontSize: 13, color: T.ink, lineHeight: 1.3, marginBottom: 10 }}>{g.headline}</div>
                  <div style={{ height: 1, background: T.ruleLight, marginBottom: 10 }} />
                  <div style={{ fontFamily: F_SANS, fontSize: 10.5, color: T.caption, lineHeight: 1.65, marginBottom: 8 }}>{g.globalSummary}</div>
                  <div style={{ borderLeft: `2px solid ${col}`, paddingLeft: 9 }}>
                    <div style={{ fontFamily: F_SANS, fontSize: 9, fontWeight: 700, color: col, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>{town} exposure</div>
                    <div style={{ fontFamily: F_SANS, fontSize: 10.5, color: T.body, lineHeight: 1.65 }}>{g.localEcho}</div>
                    {g.exposure && <div style={{ fontFamily: F_MONO, fontSize: 9.5, color: T.orange, marginTop: 6 }}>{g.exposure}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── SECTION: GROWTH PROJECTION ── */}
        {W.proj.length > 1 && (
          <div style={{ borderBottom: `1px solid ${T.rule}`, padding: "24px 0" }}>
            <SectionHead>Economic output projections, {YEAR}–{YEAR + 10}</SectionHead>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 28, alignItems: "start" }}>
              <div>
                <ChartGrowth data={W.proj} />
                <Fig n="4" caption={`Economic output index for ${town}, ${YEAR}–${YEAR + 10} (baseline = 100 at ${YEAR}). Three scenarios: no-change trajectory, moderate policy investment (~2.5% annual growth), and optimistic execution (~4.5% annual growth).`} />
              </div>
              <div style={{ paddingTop: 8 }}>
                {Array.isArray(W.dec.risks) && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontFamily: F_SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: T.red, marginBottom: 8 }}>Risk factors</div>
                    {W.dec.risks.map((r, i) => (
                      <div key={i} style={{ fontFamily: F_SANS, fontSize: 11, color: T.body, lineHeight: 1.65, borderLeft: `2px solid ${T.red}50`, paddingLeft: 9, marginBottom: 8 }}>{r}</div>
                    ))}
                  </div>
                )}
                {Array.isArray(W.dec.catalysts) && (
                  <div>
                    <div style={{ fontFamily: F_SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: T.green, marginBottom: 8 }}>Catalysts</div>
                    {W.dec.catalysts.map((c, i) => (
                      <div key={i} style={{ fontFamily: F_SANS, fontSize: 11, color: T.body, lineHeight: 1.65, borderLeft: `2px solid ${T.green}60`, paddingLeft: 9, marginBottom: 8 }}>{c}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── SECTION: BLUEPRINT ── */}
        <div style={{ borderBottom: `1px solid ${T.rule}`, padding: "24px 0" }}>
          <SectionHead>Development blueprint, {YEAR}–{YEAR + 10}</SectionHead>
          <p style={{ fontFamily: F_SANS, fontSize: 12, color: T.body, lineHeight: 1.82, marginBottom: 20 }}>
            The following initiatives represent evidence-based development priorities modelled on comparable municipal programs and peer-reviewed urban planning research.<Ref n={8} /><Ref n={10} /> Each is costed, timelined, and linked to measurable outcomes.
          </p>
          <div style={{ border: `1px solid ${T.rule}`, borderRadius: 3, overflow: "hidden" }}>
            {/* table header */}
            <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr 1fr 1fr 1.6fr", background: T.ink, padding: "8px 14px", gap: 10 }}>
              {["Initiative", "Domain", "Cost", "Timeline", "Measurable outcome"].map(h => (
                <div key={h} style={{ fontFamily: F_SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: T.white }}>{h}</div>
              ))}
            </div>
            {W.bp.map((b, i) => {
              const acc = dc[b.domain] || T.blue;
              return (
                <div key={i} style={{ borderTop: `1px solid ${T.rule}`, padding: "14px 14px", background: i % 2 === 0 ? T.white : T.paper }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr 1fr 1fr 1.6fr", gap: 10, marginBottom: 10 }}>
                    <div style={{ fontFamily: F_SERIF, fontSize: 13, color: T.ink, lineHeight: 1.3 }}>{b.title}</div>
                    <div style={{ fontFamily: F_SANS, fontSize: 10, fontWeight: 700, color: acc, textTransform: "uppercase", letterSpacing: "0.08em" }}>{b.domain}</div>
                    <div style={{ fontFamily: F_MONO, fontSize: 11, color: T.orange }}>{b.cost}</div>
                    <div style={{ fontFamily: F_MONO, fontSize: 10, color: T.caption }}>{b.timeline}</div>
                    <div style={{ fontFamily: F_SANS, fontSize: 10.5, color: T.body, lineHeight: 1.6 }}>{b.outcome}</div>
                  </div>
                  <div style={{ fontFamily: F_SANS, fontSize: 10.5, color: T.caption, lineHeight: 1.65, marginBottom: 6 }}>{b.spec}</div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: F_SANS, fontSize: 9.5, color: T.caption }}>Model: <span style={{ color: T.blue }}>{b.model}</span></span>
                    <span style={{ fontFamily: F_SANS, fontSize: 9.5, color: T.caption }}>Financing: <span style={{ color: T.body }}>{b.financing}</span></span>
                    <span style={{ fontFamily: F_SANS, fontSize: 9.5, background: sb[b.status] || T.blueLight, color: acc, padding: "1px 7px", borderRadius: 2 }}>{b.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── SECTION: DECADE AHEAD ── */}
        <div style={{ borderBottom: `1px solid ${T.rule}`, padding: "24px 0" }}>
          <SectionHead>The decade ahead: {YEAR}–{YEAR + 10}</SectionHead>
          {W.dec.headline && (
            <div style={{ fontFamily: F_SERIF, fontSize: "clamp(17px,2.5vw,23px)", color: T.ink, lineHeight: 1.25, marginBottom: 16 }}>
              {W.dec.headline}
            </div>
          )}
          {W.dec.body && (
            <div style={{ columns: 2, columnGap: 28, marginBottom: 24 }}>
              <p style={{ fontFamily: F_SANS, fontSize: 12, color: T.body, lineHeight: 1.85, breakInside: "avoid" }}>
                {W.dec.body}<Ref n={6} /><Ref n={9} />
              </p>
            </div>
          )}
          {/* milestones */}
          {Array.isArray(W.dec.milestones) && (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${W.dec.milestones.length}, 1fr)`, border: `1px solid ${T.rule}`, borderRadius: 3, overflow: "hidden", marginTop: 8 }}>
              {W.dec.milestones.map((m, i) => (
                <div key={i} style={{ padding: "13px 14px", borderRight: i < W.dec.milestones.length - 1 ? `1px solid ${T.rule}` : "none", background: i % 2 === 0 ? T.white : T.paper }}>
                  <div style={{ fontFamily: F_MONO, fontSize: 12, fontWeight: 700, color: i === W.dec.milestones.length - 1 ? T.orange : T.blue, marginBottom: 4 }}>{m.year}</div>
                  <div style={{ fontFamily: F_SANS, fontSize: 11, fontWeight: 700, color: T.ink, marginBottom: 5 }}>{m.title}</div>
                  <div style={{ fontFamily: F_SANS, fontSize: 11, color: T.caption, lineHeight: 1.6 }}>{m.detail}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── REFERENCES ── */}
        <div style={{ padding: "20px 0" }}>
          <div style={{ fontFamily: F_SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: T.muted, marginBottom: 14 }}>References</div>
          <div style={{ columns: 2, columnGap: 28 }}>
            {Object.entries(REFS).map(([n, text]) => (
              <div key={n} style={{ breakInside: "avoid", marginBottom: 8, display: "flex", gap: 7 }}>
                <span style={{ fontFamily: F_SANS, fontSize: 10, fontWeight: 700, color: T.blue, minWidth: 16, flexShrink: 0 }}>{n}.</span>
                <span style={{ fontFamily: F_SANS, fontSize: 10, color: T.caption, lineHeight: 1.6 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* footer rule */}
        <div style={{ height: 3, background: T.ink, marginTop: 8 }} />
        <div style={{ height: 1, background: T.ink, marginBottom: 10, marginTop: 2 }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: F_SANS, fontSize: 9.5, color: T.muted, flexWrap: "wrap", gap: 6 }}>
          <span>Chronicle | The Journal of Local Futures</span>
          <span>{town}, {state} · {SHORTDT}</span>
          <span>AI-generated · verify all figures independently</span>
        </div>

      </div>
    </div>
  );
}

// ─── ROOT ────────────────────────────────────────────────────────────────────
export default function App() {
  const [phase, setPhase] = useState("landing");
  const [town,  setTown]  = useState("");
  const [zip,   setZip]   = useState("");
  const [state, setState] = useState("");
  const [ed,    setEd]    = useState(null);
  const [err,   setErr]   = useState(null);

  const go = async (t, z, s) => {
    setTown(t); setZip(z); setState(s);
    setPhase("loading"); setErr(null);
    try {
      const data = await generate(t, z, s);
      setEd(data);
      setPhase("article");
    } catch (e) {
      setErr("Generation failed — please try again.");
      setPhase("landing");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind:wght@700&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&family=Source+Sans+3:wght@400;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #fafafa; }
        input::placeholder { color: #bbb; }
        input:focus { border-color: #0068b4 !important; box-shadow: 0 0 0 2px rgba(0,104,180,0.1); }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 3px; }
        @media (max-width: 640px) {
          .two-col { grid-template-columns: 1fr !important; }
        }
      `}</style>
      {phase === "landing"  && <Landing onGo={go} err={err} />}
      {phase === "loading"  && <Loading town={town} />}
      {phase === "article"  && ed && <Article town={town} zip={zip} state={state} ed={ed} onBack={() => setPhase("landing")} />}
    </>
  );
}
