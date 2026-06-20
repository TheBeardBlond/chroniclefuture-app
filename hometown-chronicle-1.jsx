import { useMemo, useState } from "react";
import { supabase } from "./src/utils/supabase.js";

const REPORT_SECTIONS = [
  "Local Signals",
  "State Signals",
  "National Signals",
  "Global Signals",
  "Technology Watch",
  "Commodity & Resource Watch",
  "Opportunity Engine",
  "Risk Radar",
  "Geographic SWOT",
  "Decade Outlook"
];

const sampleReport = {
  executiveSummary:
    "Chronicle Future converts place-based signals into practical opportunity and risk intelligence for entrepreneurs, operators, and investors.",
  signals: [
    { scope: "Local", title: "Main-street reinvestment window", detail: "Small business services, light industrial reuse, and downtown housing demand create near-term operating leverage.", impact: "High" },
    { scope: "State", title: "Infrastructure funding cycle", detail: "Transportation, broadband, and energy grants favor operators that can attach to public-capital projects.", impact: "Medium" },
    { scope: "National", title: "Labor reallocation", detail: "Hybrid work and skilled-trade shortages reward companies that can train locally and sell regionally.", impact: "High" }
  ],
  opportunities: [
    { name: "Local services roll-up", score: 84, capital: "Low–Medium", horizon: "6–18 months", confidence: "Medium" },
    { name: "Energy-efficiency contractor", score: 78, capital: "Medium", horizon: "12–24 months", confidence: "Medium" },
    { name: "Specialty food manufacturing", score: 72, capital: "Medium", horizon: "18–36 months", confidence: "Low–Medium" }
  ],
  risks: [
    "Thin workforce pipelines can slow execution for labor-intensive businesses.",
    "Public funding timing can shift project economics and delay payback periods.",
    "Commodity and insurance volatility can pressure small operators' margins."
  ],
  swot: {
    strengths: ["Local identity", "Lower operating costs", "Regional supplier relationships"],
    weaknesses: ["Limited growth capital", "Aging infrastructure", "Narrow talent pools"],
    opportunities: ["Downtown reuse", "State/federal grants", "Remote-work migration"],
    threats: ["Rate sensitivity", "Climate/insurance costs", "Population stagnation"]
  },
  decadeOutlook:
    "The strongest decade-long strategy is to pair pragmatic infrastructure investment with businesses that export value beyond the local market while employing local labor."
};

function safeJsonParse(text) {
  if (!text || typeof text !== "string") return null;
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function createReport(location) {
  const prompt = `Create a Chronicle Future MVP intelligence brief for ${location.city}, ${location.state} ${location.zip}.
Return only valid JSON with this shape:
{
  "executiveSummary": "2 sentences",
  "signals": [{"scope":"Local|State|National|Global|Technology|Commodity", "title":"...", "detail":"...", "impact":"Low|Medium|High"}],
  "opportunities": [{"name":"...", "score": 0-100, "capital":"Low|Medium|High", "horizon":"...", "confidence":"Low|Medium|High"}],
  "risks": ["..."],
  "swot": {"strengths": ["..."], "weaknesses": ["..."], "opportunities": ["..."], "threats": ["..."]},
  "decadeOutlook": "one dense paragraph"
}`;

  const response = await fetch("/api/generate-gpt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, max_tokens: 1800 })
  });

  if (!response.ok) throw new Error("Report generation failed");

  const payload = await response.json();
  const parsed = safeJsonParse(payload.text);
  if (!parsed) throw new Error("The AI response was not valid report JSON");

  try {
    await supabase.from("reports").insert({
      town: location.city,
      state: location.state,
      zip: location.zip,
      report: parsed,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.warn("Supabase save skipped:", error.message);
  }

  return parsed;
}

function Badge({ children, tone = "neutral" }) {
  const colors = {
    High: "#b42318",
    Medium: "#b54708",
    Low: "#027a48",
    neutral: "#475467"
  };
  return <span className="badge" style={{ color: colors[tone] || colors.neutral }}>{children}</span>;
}

function LandingForm({ onSubmit, loading }) {
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const valid = city.trim() && state.trim() && zip.trim();

  const submit = (event) => {
    event.preventDefault();
    if (valid) onSubmit({ city: city.trim(), state: state.trim().toUpperCase(), zip: zip.trim() });
  };

  return (
    <form className="card form" onSubmit={submit}>
      <label>
        City
        <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Bay City" />
      </label>
      <label>
        State
        <input value={state} onChange={(event) => setState(event.target.value)} placeholder="MI" maxLength={2} />
      </label>
      <label>
        ZIP
        <input value={zip} onChange={(event) => setZip(event.target.value)} placeholder="48708" inputMode="numeric" />
      </label>
      <button type="submit" disabled={!valid || loading}>{loading ? "Generating brief…" : "Generate intelligence brief"}</button>
    </form>
  );
}

function Report({ location, report, onReset }) {
  const swotEntries = useMemo(() => Object.entries(report.swot || {}), [report]);

  return (
    <main className="report">
      <div className="report-header">
        <div>
          <p className="eyebrow">Chronicle Future MVP</p>
          <h1>{location.city}, {location.state}</h1>
          <p className="lede">{report.executiveSummary}</p>
        </div>
        <button className="secondary" onClick={onReset}>New location</button>
      </div>

      <section className="grid sections">
        {REPORT_SECTIONS.map((section) => <span key={section}>{section}</span>)}
      </section>

      <section className="card">
        <h2>Signal Board</h2>
        <div className="signal-list">
          {(report.signals || []).map((signal) => (
            <article key={`${signal.scope}-${signal.title}`} className="signal">
              <div><Badge>{signal.scope}</Badge><h3>{signal.title}</h3></div>
              <p>{signal.detail}</p>
              <Badge tone={signal.impact}>{signal.impact} impact</Badge>
            </article>
          ))}
        </div>
      </section>

      <section className="grid two">
        <div className="card">
          <h2>Opportunity Engine</h2>
          {(report.opportunities || []).map((item) => (
            <article key={item.name} className="opportunity">
              <strong>{item.name}</strong>
              <span className="score">{item.score}</span>
              <p>{item.capital} capital · {item.horizon} · {item.confidence} confidence</p>
            </article>
          ))}
        </div>
        <div className="card danger">
          <h2>Risk Radar</h2>
          <ul>{(report.risks || []).map((risk) => <li key={risk}>{risk}</li>)}</ul>
        </div>
      </section>

      <section className="grid swot">
        {swotEntries.map(([name, items]) => (
          <div className="card" key={name}>
            <h2>{name}</h2>
            <ul>{(items || []).map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        ))}
      </section>

      <section className="card outlook">
        <h2>Decade Outlook</h2>
        <p>{report.decadeOutlook}</p>
      </section>
    </main>
  );
}

export default function App() {
  const [location, setLocation] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (nextLocation) => {
    setLocation(nextLocation);
    setLoading(true);
    setError("");
    try {
      setReport(await createReport(nextLocation));
    } catch (err) {
      console.error(err);
      setReport(sampleReport);
      setError("Live generation failed, so a sample brief is shown. Check API keys and model responses before production use.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        :root { color: #101828; background: #f6f3ec; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        body { margin: 0; background: radial-gradient(circle at top left, #fff7e6 0, #f6f3ec 34%, #eef4ff 100%); }
        button, input { font: inherit; }
        .shell { max-width: 1120px; margin: 0 auto; padding: 48px 20px 72px; }
        .hero { display: grid; grid-template-columns: 1.25fr .75fr; gap: 28px; align-items: center; min-height: 78vh; }
        .eyebrow { margin: 0 0 12px; color: #175cd3; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; font-size: 12px; }
        h1 { margin: 0; font-family: Georgia, serif; font-size: clamp(46px, 8vw, 92px); line-height: .92; letter-spacing: -.06em; }
        h2 { margin: 0 0 16px; font-size: 18px; letter-spacing: -.02em; text-transform: capitalize; }
        h3 { margin: 7px 0 0; font-size: 18px; }
        .lede { color: #475467; font-size: 20px; line-height: 1.55; max-width: 720px; }
        .card { background: rgba(255,255,255,.86); border: 1px solid rgba(16,24,40,.12); border-radius: 22px; padding: 24px; box-shadow: 0 22px 70px rgba(16,24,40,.08); backdrop-filter: blur(14px); }
        .form { display: grid; gap: 16px; }
        label { display: grid; gap: 8px; color: #344054; font-weight: 700; }
        input { width: 100%; border: 1px solid #d0d5dd; border-radius: 14px; padding: 13px 14px; background: #fff; color: #101828; box-sizing: border-box; }
        button { border: 0; border-radius: 999px; padding: 13px 18px; background: #175cd3; color: #fff; font-weight: 800; cursor: pointer; }
        button:disabled { background: #98a2b3; cursor: not-allowed; }
        .secondary { background: #101828; align-self: start; }
        .notice { margin-top: 18px; color: #b54708; font-weight: 700; }
        .report { display: grid; gap: 24px; }
        .report-header { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; }
        .grid { display: grid; gap: 18px; }
        .sections { grid-template-columns: repeat(5, 1fr); }
        .sections span { border: 1px solid rgba(23,92,211,.18); border-radius: 999px; padding: 10px 12px; text-align: center; color: #175cd3; background: rgba(255,255,255,.62); font-size: 13px; font-weight: 800; }
        .signal-list { display: grid; gap: 14px; }
        .signal { display: grid; grid-template-columns: 1fr 2fr auto; gap: 16px; padding: 16px 0; border-top: 1px solid #eaecf0; align-items: center; }
        .badge { display: inline-flex; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; }
        .two { grid-template-columns: 1fr 1fr; }
        .opportunity { display: grid; grid-template-columns: 1fr auto; gap: 5px 14px; padding: 14px 0; border-top: 1px solid #eaecf0; }
        .opportunity p { grid-column: 1 / -1; margin: 0; color: #667085; }
        .score { color: #027a48; font-weight: 900; font-size: 26px; }
        li { margin: 10px 0; color: #475467; line-height: 1.5; }
        .danger { border-color: rgba(180,35,24,.2); }
        .swot { grid-template-columns: repeat(4, 1fr); }
        .outlook p { color: #344054; font-size: 18px; line-height: 1.7; }
        @media (max-width: 850px) { .hero, .two, .swot, .sections { grid-template-columns: 1fr; } .report-header, .signal { display: grid; } }
      `}</style>
      <div className="shell">
        {!report ? (
          <div className="hero">
            <section>
              <p className="eyebrow">The journal of local futures</p>
              <h1>Decision support for what your city becomes next.</h1>
              <p className="lede">Enter a location to generate a focused MVP intelligence brief across signals, opportunities, risks, SWOT, and the decade outlook.</p>
              {error && <p className="notice">{error}</p>}
            </section>
            <LandingForm onSubmit={handleSubmit} loading={loading} />
          </div>
        ) : (
          <>
            {error && <p className="notice">{error}</p>}
            <Report location={location} report={report} onReset={() => { setReport(null); setError(""); }} />
          </>
        )}
      </div>
    </>
  );
}
