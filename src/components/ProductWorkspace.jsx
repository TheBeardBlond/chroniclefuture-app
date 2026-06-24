function IconMark({ children }) {
  return <span className="tool-symbol" aria-hidden="true">{children}</span>;
}

const SECTIONS = {
  main: {
    eyebrow: "Chronicle Future workspace",
    title: "Your decision center",
    copy: "Move from changing conditions to a grounded forecast, a business plan, and the next action."
  },
  tools: {
    eyebrow: "Tools",
    title: "Intelligence you can put to work",
    copy: "Every working tool is collected here, with a direct path to the place where you use it."
  },
  forecast: {
    eyebrow: "Forecast models",
    title: "Model what comes next",
    copy: "Connect location signals and business assumptions to practical forward scenarios."
  },
  industry: {
    eyebrow: "Industry outlook",
    title: "See the forces reshaping your market",
    copy: "Track the technology, energy, trade, resource, demographic, and capital shifts affecting demand."
  },
  investors: {
    eyebrow: "Find investors",
    title: "Prepare first. Match capital next.",
    copy: "Investor discovery is being built as the next layer of Chronicle Future. Your plan and financial model will become the foundation."
  }
};

const TOOLS = [
  { icon: "LI", title: "Location Intelligence Brief", copy: "Generate local, state, national, global, technology, and commodity signals for a chosen location.", action: "Open locations", target: "workspace" },
  { icon: "SW", title: "Geographic SWOT", copy: "Turn geography, infrastructure, workforce, demographics, and industry mix into strengths, weaknesses, opportunities, and threats.", action: "Build a location brief", target: "workspace" },
  { icon: "OE", title: "Opportunity Engine", copy: "Identify who benefits, who loses, which businesses become more attractive, and how much confidence to place in the signal.", action: "Open intelligence", target: "workspace" },
  { icon: "RR", title: "Risk Radar", copy: "Rank emerging risks by impact, timing, and the decisions they could change.", action: "Open risk analysis", target: "workspace" },
  { icon: "BP", title: "Business Plan Studio", copy: "Build a lender-ready plan with twelve evidence-based sections and a live completion score.", action: "Build my plan", target: "founder", detail: "plan" },
  { icon: "FM", title: "Financial Model Lab", copy: "Model revenue, margin, break-even volume, cash runway, debt service, and the first-year outlook.", action: "Open financial model", target: "founder", detail: "financials" },
  { icon: "90", title: "90-Day Execution Plan", copy: "Convert founder fundamentals and the latest SWOT into measurable next actions.", action: "Build the 90-day plan", target: "founder", detail: "execution" },
  { icon: "OS", title: "Business Command Center", copy: "Keep the business profile, goals, planning, finances, and execution in one working system.", action: "Open Founder OS", target: "founder", detail: "overview" }
];

const OUTLOOKS = [
  ["Technology", "AI infrastructure, automation, semiconductors, data centers, and workforce displacement", "AI"],
  ["Energy", "Power supply, grid capacity, fuel markets, electrification, and project constraints", "EN"],
  ["Trade & Industry", "Tariffs, supply chains, manufacturing capacity, logistics, and regional production", "TI"],
  ["Capital", "Rates, lending conditions, business investment, consumer pressure, and asset repricing", "CA"]
];

function ToolCard({ tool, onNavigate }) {
  return (
    <article className="product-card tool-card">
      <IconMark>{tool.icon}</IconMark>
      <h3>{tool.title}</h3>
      <p>{tool.copy}</p>
      <button onClick={() => onNavigate(tool.target, tool.detail)}>{tool.action} <span aria-hidden="true">→</span></button>
    </article>
  );
}

function MainWorkspace({ user, onNavigate }) {
  const firstName = user?.user_metadata?.full_name?.split(" ")?.[0]
    || user?.email?.split("@")[0]
    || "there";
  return (
    <>
      <section className="product-hero">
        <div>
          <p className="product-kicker">Welcome back, {firstName}</p>
          <h1>What are we solving today?</h1>
          <p>Start with the decision in front of you. Chronicle Future will take you to the right intelligence, model, or operating tool.</p>
        </div>
        <div className="decision-actions" aria-label="Common starting points">
          <button onClick={() => onNavigate("workspace")}><IconMark>LI</IconMark> Understand a location</button>
          <button onClick={() => onNavigate("forecast")}><IconMark>FM</IconMark> Explore a forecast</button>
          <button onClick={() => onNavigate("founder", "overview")}><IconMark>OS</IconMark> Build my business</button>
        </div>
      </section>
      <section className="product-section">
        <header><div><p className="product-kicker">Quick access</p><h2>Your working areas</h2></div></header>
        <div className="product-grid product-grid-three">
          <ToolCard tool={TOOLS[0]} onNavigate={onNavigate} />
          <ToolCard tool={TOOLS[5]} onNavigate={onNavigate} />
          <ToolCard tool={TOOLS[7]} onNavigate={onNavigate} />
        </div>
      </section>
      <section className="product-band">
        <div><span>01</span><h3>Observe</h3><p>Gather the signals changing a place or industry.</p></div>
        <div><span>02</span><h3>Model</h3><p>Test the implications and the assumptions underneath them.</p></div>
        <div><span>03</span><h3>Act</h3><p>Turn the clearest insight into a measurable next move.</p></div>
      </section>
    </>
  );
}

function ForecastWorkspace({ onNavigate }) {
  return (
    <div className="product-grid product-grid-two">
      <article className="forecast-panel">
        <IconMark>LI</IconMark>
        <p className="product-kicker">Geographic model</p>
        <h2>Location Decade Outlook</h2>
        <p>Build a signal-based view across local, state, national, and global forces, then examine opportunities, risks, SWOT, and long-range scenarios.</p>
        <button onClick={() => onNavigate("workspace")}>Choose a location <span aria-hidden="true">→</span></button>
      </article>
      <article className="forecast-panel">
        <IconMark>FM</IconMark>
        <p className="product-kicker">Business model</p>
        <h2>Founder Financial Outlook</h2>
        <p>Change pricing, costs, volume, growth, cash, and financing assumptions to see break-even, runway, and year-one performance.</p>
        <button onClick={() => onNavigate("founder", "financials")}>Open the model <span aria-hidden="true">→</span></button>
      </article>
    </div>
  );
}

function IndustryWorkspace({ onNavigate }) {
  return (
    <>
      <div className="outlook-grid">
        {OUTLOOKS.map(([title, copy, icon]) => (
          <article key={title}><IconMark>{icon}</IconMark><h3>{title}</h3><p>{copy}</p></article>
        ))}
      </div>
      <section className="industry-cta">
        <div><p className="product-kicker">Make it specific</p><h2>Connect an industry trend to a real location.</h2><p>The strongest outlook is grounded in workforce, infrastructure, energy, resources, transportation, and the local industry mix.</p></div>
        <button onClick={() => onNavigate("workspace")}>Run location intelligence</button>
      </section>
    </>
  );
}

function InvestorWorkspace({ onNavigate }) {
  return (
    <section className="investor-roadmap">
      <div className="coming-pill">In development</div>
      <IconMark>IN</IconMark>
      <h2>Capital matching will begin with readiness.</h2>
      <p>Chronicle Future will use your business stage, industry, geography, funding need, plan, and financial model to help surface relevant capital sources. We will not promise a match or expose your information without your control.</p>
      <div className="readiness-list">
        <span>Business profile</span><span>Evidence-based plan</span><span>Financial model</span><span>Funding request</span>
      </div>
      <button onClick={() => onNavigate("founder", "plan")}>Prepare my business now</button>
    </section>
  );
}

export default function ProductWorkspace({ user, section = "main", onNavigate }) {
  const page = SECTIONS[section] || SECTIONS.main;
  return (
    <main className="product-workspace">
      <style>{PRODUCT_STYLES}</style>
      {section !== "main" ? <header className="product-page-head"><p className="product-kicker">{page.eyebrow}</p><h1>{page.title}</h1><p>{page.copy}</p></header> : null}
      {section === "main" ? <MainWorkspace user={user} onNavigate={onNavigate} /> : null}
      {section === "tools" ? <div className="product-grid product-grid-two">{TOOLS.map((tool) => <ToolCard key={tool.title} tool={tool} onNavigate={onNavigate} />)}</div> : null}
      {section === "forecast" ? <ForecastWorkspace onNavigate={onNavigate} /> : null}
      {section === "industry" ? <IndustryWorkspace onNavigate={onNavigate} /> : null}
      {section === "investors" ? <InvestorWorkspace onNavigate={onNavigate} /> : null}
    </main>
  );
}

const PRODUCT_STYLES = `
  .product-workspace { max-width: 1240px; min-height: 70vh; margin: auto; padding: clamp(38px, 6vw, 76px) var(--gutter) 90px; }
  .product-kicker { margin: 0 0 10px; color: var(--green); font-size: 11px; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; }
  .product-page-head { max-width: 780px; margin-bottom: 38px; }
  .product-page-head h1, .product-hero h1 { margin: 0 0 16px; font-size: clamp(38px, 6vw, 66px); line-height: 1; }
  .product-page-head > p:last-child, .product-hero > div > p:last-child { max-width: 680px; color: var(--ink-2); font-size: 17px; line-height: 1.6; }
  .product-hero { display: grid; grid-template-columns: 1.15fr .85fr; gap: clamp(32px, 6vw, 78px); align-items: center; padding-bottom: 56px; border-bottom: 1px solid var(--line); }
  .decision-actions { display: grid; border-top: 1px solid var(--line-strong); }
  .decision-actions button { display: grid; grid-template-columns: 28px 1fr; align-items: center; gap: 14px; border: 0; border-bottom: 1px solid var(--line-strong); background: #fff; padding: 20px; text-align: left; font-weight: 800; }
  .decision-actions button:hover { background: #eef6fa; color: var(--green); }
  .decision-actions svg { width: 22px; color: var(--green); }
  .product-section { padding: 54px 0; }
  .product-section header { display: flex; justify-content: space-between; align-items: end; margin-bottom: 24px; }
  .product-section h2 { margin: 0; font-size: clamp(28px, 4vw, 42px); }
  .product-grid { display: grid; gap: 1px; border: 1px solid var(--line-strong); background: var(--line-strong); }
  .product-grid-two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .product-grid-three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .product-card, .forecast-panel { min-height: 270px; display: flex; flex-direction: column; align-items: flex-start; background: #fff; padding: clamp(22px, 3vw, 30px); }
  .tool-symbol { width: 34px; height: 34px; display: inline-grid; place-items: center; flex: none; border: 1px solid var(--green); color: var(--green); font-size: 10px; font-weight: 900; letter-spacing: .05em; }
  .product-card h3 { margin: 34px 0 10px; font-size: 23px; }
  .product-card p, .forecast-panel p { flex: 1; color: var(--ink-3); line-height: 1.55; }
  .product-card button, .forecast-panel button, .industry-cta button, .investor-roadmap button { border: 0; background: none; color: var(--green); padding: 6px 0; font-weight: 900; text-align: left; }
  .product-band { display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid var(--green-800); background: var(--green-900); color: #fff; }
  .product-band div { min-height: 160px; border-right: 1px solid #54798b; padding: 24px; }
  .product-band div:last-child { border-right: 0; }
  .product-band span { color: var(--lime); font-family: var(--serif); font-size: 26px; }
  .product-band h3 { margin: 22px 0 8px; font-size: 22px; }
  .product-band p { color: #b9d2dd; font-size: 13px; line-height: 1.5; }
  .forecast-panel { min-height: 390px; }
  .forecast-panel .product-kicker { margin-top: 38px; }
  .forecast-panel h2 { margin: 0 0 14px; font-size: 34px; }
  .outlook-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border: 1px solid var(--line-strong); }
  .outlook-grid article { min-height: 250px; border-right: 1px solid var(--line-strong); background: #fff; padding: 24px; }
  .outlook-grid article:last-child { border-right: 0; }
  .outlook-grid h3 { margin: 48px 0 10px; font-size: 23px; }
  .outlook-grid p { color: var(--ink-3); font-size: 13px; line-height: 1.55; }
  .industry-cta { display: grid; grid-template-columns: 1fr auto; gap: 36px; align-items: center; margin-top: 32px; background: var(--green-900); color: #fff; padding: clamp(28px, 4vw, 46px); }
  .industry-cta h2 { margin: 0 0 10px; font-size: 34px; }
  .industry-cta p:last-child { max-width: 720px; margin: 0; color: #b9d2dd; line-height: 1.55; }
  .industry-cta button { align-self: center; border: 1px solid var(--lime); color: var(--lime); padding: 12px 16px; }
  .investor-roadmap { max-width: 820px; border-top: 4px solid var(--green); background: #fff; padding: clamp(28px, 5vw, 58px); }
  .investor-roadmap > .tool-symbol { margin: 30px 0 22px; }
  .investor-roadmap h2 { max-width: 620px; margin: 0 0 16px; font-size: clamp(30px, 5vw, 48px); }
  .investor-roadmap > p { color: var(--ink-2); font-size: 16px; line-height: 1.65; }
  .coming-pill { display: inline-flex; background: #e8f4f9; color: var(--green-800); padding: 6px 10px; font-size: 10px; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }
  .readiness-list { display: flex; flex-wrap: wrap; gap: 8px; margin: 28px 0; }
  .readiness-list span { border: 1px solid var(--line); background: var(--paper); padding: 8px 10px; font-size: 12px; font-weight: 700; }
  @media (max-width: 900px) {
    .product-hero, .product-grid-two, .product-grid-three, .industry-cta { grid-template-columns: 1fr; }
    .outlook-grid { grid-template-columns: repeat(2, 1fr); }
    .outlook-grid article:nth-child(2) { border-right: 0; }
    .outlook-grid article { border-bottom: 1px solid var(--line-strong); }
  }
  @media (max-width: 560px) {
    .product-band, .outlook-grid { grid-template-columns: 1fr; }
    .product-band div, .outlook-grid article { border-right: 0; border-bottom: 1px solid var(--line-strong); }
    .product-card, .forecast-panel { min-height: 240px; }
  }
`;
