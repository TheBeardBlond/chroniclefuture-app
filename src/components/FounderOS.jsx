import { useEffect, useMemo, useState } from "react";
import { supabase } from "../utils/supabase.js";

const PLAN_SECTIONS = [
  ["executive_summary", "Executive summary", "What are you building, for whom, and why will it win?"],
  ["problem", "Customer problem", "Describe the costly or frustrating problem your customer has today."],
  ["solution", "Product or service", "Explain the offer and the outcome customers receive."],
  ["target_customer", "Target customer", "Define the primary buyer, user, geography, and buying trigger."],
  ["market_analysis", "Market analysis", "Summarize market size, demand signals, trends, and local conditions."],
  ["competitive_advantage", "Competitive advantage", "Why should customers choose you instead of alternatives?"],
  ["revenue_model", "Revenue model", "Explain pricing, purchase frequency, margins, and recurring revenue."],
  ["marketing_sales", "Marketing and sales", "Describe acquisition channels, sales process, and retention."],
  ["operations", "Operations", "List suppliers, facilities, technology, staffing, and delivery process."],
  ["team", "Team", "Identify owners, key roles, experience, and near-term hiring needs."],
  ["funding_request", "Funding request", "State how much capital is needed and exactly how it will be used."],
  ["milestones", "Milestones", "Define the next measurable achievements and target dates."]
];

const EMPTY_FINANCIALS = {
  startup_costs: 25000,
  monthly_fixed_costs: 5000,
  unit_price: 100,
  unit_cost: 40,
  monthly_units: 100,
  monthly_growth_rate: 5,
  cash_on_hand: 30000,
  loan_amount: 0,
  annual_interest_rate: 9,
  loan_term_months: 60
};

const EMPTY_BUSINESS = {
  name: "",
  stage: "idea",
  industry: "",
  business_model: "",
  description: "",
  target_customer: "",
  goals: "",
  funding_need: 0,
  currency: "USD",
  location_id: ""
};

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(numberValue(value));
}

function calculateFinancials(input) {
  const assumptions = Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, numberValue(value)])
  );
  const contribution = assumptions.unit_price - assumptions.unit_cost;
  const monthlyRevenue = assumptions.unit_price * assumptions.monthly_units;
  const monthlyGrossProfit = contribution * assumptions.monthly_units;
  const monthlyRate = assumptions.annual_interest_rate / 1200;
  const loanPayment = assumptions.loan_amount > 0
    ? monthlyRate > 0
      ? assumptions.loan_amount * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -Math.max(1, assumptions.loan_term_months))))
      : assumptions.loan_amount / Math.max(1, assumptions.loan_term_months)
    : 0;
  const monthlyOperatingProfit = monthlyGrossProfit - assumptions.monthly_fixed_costs - loanPayment;
  const breakEvenUnits = contribution > 0
    ? Math.ceil((assumptions.monthly_fixed_costs + loanPayment) / contribution)
    : 0;
  const runwayMonths = monthlyOperatingProfit < 0 && assumptions.cash_on_hand > 0
    ? assumptions.cash_on_hand / Math.abs(monthlyOperatingProfit)
    : null;

  let yearOneRevenue = 0;
  let yearOneProfit = 0;
  let units = assumptions.monthly_units;
  for (let month = 0; month < 12; month += 1) {
    const revenue = units * assumptions.unit_price;
    const profit = units * contribution - assumptions.monthly_fixed_costs - loanPayment;
    yearOneRevenue += revenue;
    yearOneProfit += profit;
    units *= 1 + assumptions.monthly_growth_rate / 100;
  }

  return {
    monthly_revenue: monthlyRevenue,
    monthly_gross_profit: monthlyGrossProfit,
    monthly_operating_profit: monthlyOperatingProfit,
    gross_margin: assumptions.unit_price > 0 ? (contribution / assumptions.unit_price) * 100 : 0,
    break_even_units: breakEvenUnits,
    runway_months: runwayMonths,
    loan_payment: loanPayment,
    year_one_revenue: yearOneRevenue,
    year_one_profit: yearOneProfit,
    startup_capital_required: Math.max(0, assumptions.startup_costs - assumptions.cash_on_hand)
  };
}

function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function swotText(item) {
  if (typeof item === "string") return item;
  return item?.title || item?.text || item?.description || "";
}

function swotList(value) {
  return Array.isArray(value) ? value.map(swotText).filter(Boolean) : [];
}

function completionFor(plan) {
  const complete = PLAN_SECTIONS.filter(([key]) => String(plan?.[key] || "").trim().length > 20).length;
  return Math.round((complete / PLAN_SECTIONS.length) * 100);
}

function FounderGate({ onBack }) {
  return (
    <main className="founder-shell founder-gate">
      <button className="founder-back" onClick={onBack}>Back to workspace</button>
      <section>
        <p className="founder-kicker">Subscriber workspace</p>
        <h1>Build the business, not just the report.</h1>
        <p>Founder OS turns Chronicle Future intelligence into a lender-ready plan, financial model, and 90-day operating system. Monthly or owner access is required.</p>
        <button className="founder-primary" onClick={onBack}>Review plans and access</button>
      </section>
      <style>{FOUNDER_STYLES}</style>
    </main>
  );
}

export default function FounderOS({ user, onBack, initialTab = "overview" }) {
  const [loading, setLoading] = useState(true);
  const [entitlement, setEntitlement] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [activeBusinessId, setActiveBusinessId] = useState("");
  const [businessDraft, setBusinessDraft] = useState(EMPTY_BUSINESS);
  const [plan, setPlan] = useState({});
  const [financials, setFinancials] = useState(EMPTY_FINANCIALS);
  const [executionItems, setExecutionItems] = useState([]);
  const [latestSwot, setLatestSwot] = useState(null);
  const [tab, setTab] = useState(initialTab);
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");
  const [taskDraft, setTaskDraft] = useState({ title: "", category: "Launch", due_date: daysFromNow(30) });

  const activeBusiness = businesses.find((business) => business.id === activeBusinessId) || null;
  const planCompletion = completionFor(plan);
  const financialOutputs = useMemo(() => calculateFinancials(financials), [financials]);
  const completedTasks = executionItems.filter((item) => item.status === "done").length;
  const taskCompletion = executionItems.length ? Math.round((completedTasks / executionItems.length) * 100) : 0;
  const hasAccess = entitlement?.status === "active"
    && (entitlement?.plan === "monthly" || entitlement?.plan === "owner");

  const loadIndex = async () => {
    setLoading(true);
    setMessage("");
    const [entitlementResult, businessesResult, locationsResult] = await Promise.all([
      supabase.from("cf_entitlements").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("cf_businesses").select("*").eq("user_id", user.id).eq("status", "active").order("updated_at", { ascending: false }),
      supabase.from("cf_locations").select("id,city,state,zip").eq("user_id", user.id).order("created_at", { ascending: false })
    ]);
    const error = entitlementResult.error || businessesResult.error || locationsResult.error;
    if (error) setMessage(error.message || "Unable to load Founder OS.");
    setEntitlement(entitlementResult.data || null);
    setBusinesses(businessesResult.data || []);
    setLocations(locationsResult.data || []);
    setActiveBusinessId((current) => current || businessesResult.data?.[0]?.id || "");
    setLoading(false);
  };

  useEffect(() => { loadIndex(); }, [user.id]);

  const loadBusinessWorkspace = async (business) => {
    if (!business) return;
    setLoading(true);
    const requests = [
      supabase.from("cf_business_plans").select("*").eq("business_id", business.id).maybeSingle(),
      supabase.from("cf_financial_models").select("*").eq("business_id", business.id).maybeSingle(),
      supabase.from("cf_execution_items").select("*").eq("business_id", business.id).order("due_date", { ascending: true })
    ];
    if (business.location_id) {
      requests.push(
        supabase.from("cf_swots").select("*").eq("location_id", business.location_id).order("created_at", { ascending: false }).limit(1).maybeSingle()
      );
    }
    const [planResult, financialResult, tasksResult, swotResult] = await Promise.all(requests);
    const error = planResult.error || financialResult.error || tasksResult.error;
    if (error) setMessage(error.message || "Unable to load this business.");
    setPlan(planResult.data?.plan || {});
    setFinancials({ ...EMPTY_FINANCIALS, ...(financialResult.data?.assumptions || {}) });
    setExecutionItems(tasksResult.data || []);
    setLatestSwot(swotResult?.data || null);
    setBusinessDraft({
      name: business.name,
      stage: business.stage,
      industry: business.industry,
      business_model: business.business_model,
      description: business.description,
      target_customer: business.target_customer,
      goals: (business.goals || []).join(", "),
      funding_need: business.funding_need,
      currency: business.currency,
      location_id: business.location_id || ""
    });
    setLoading(false);
  };

  useEffect(() => { loadBusinessWorkspace(activeBusiness); }, [activeBusinessId, activeBusiness?.location_id]);

  const updateBusinessDraft = (field) => (event) => {
    setBusinessDraft((current) => ({ ...current, [field]: event.target.value }));
  };

  const createBusiness = async (event) => {
    event.preventDefault();
    setSaving("business");
    setMessage("");
    const payload = {
      user_id: user.id,
      location_id: businessDraft.location_id || null,
      name: businessDraft.name.trim(),
      stage: businessDraft.stage,
      industry: businessDraft.industry.trim(),
      business_model: businessDraft.business_model.trim(),
      description: businessDraft.description.trim(),
      target_customer: businessDraft.target_customer.trim(),
      goals: businessDraft.goals.split(",").map((goal) => goal.trim()).filter(Boolean),
      funding_need: numberValue(businessDraft.funding_need),
      currency: businessDraft.currency || "USD"
    };
    const { data, error } = await supabase.from("cf_businesses").insert(payload).select().single();
    if (error) setMessage(error.message || "Unable to create the business.");
    else {
      setBusinesses((current) => [data, ...current]);
      setActiveBusinessId(data.id);
      setMessage("Business workspace created.");
    }
    setSaving("");
  };

  const saveBusiness = async (event) => {
    event.preventDefault();
    if (!activeBusiness) return;
    setSaving("business");
    const updates = {
      location_id: businessDraft.location_id || null,
      name: businessDraft.name.trim(),
      stage: businessDraft.stage,
      industry: businessDraft.industry.trim(),
      business_model: businessDraft.business_model.trim(),
      description: businessDraft.description.trim(),
      target_customer: businessDraft.target_customer.trim(),
      goals: businessDraft.goals.split(",").map((goal) => goal.trim()).filter(Boolean),
      funding_need: numberValue(businessDraft.funding_need),
      currency: businessDraft.currency || "USD",
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase.from("cf_businesses").update(updates).eq("id", activeBusiness.id).select().single();
    if (error) setMessage(error.message || "Unable to save the profile.");
    else {
      setBusinesses((current) => current.map((item) => item.id === data.id ? data : item));
      setMessage("Business profile saved.");
    }
    setSaving("");
  };

  const buildStarterPlan = () => {
    if (!activeBusiness) return;
    setPlan((current) => ({
      ...current,
      executive_summary: current.executive_summary || `${activeBusiness.name} is a ${activeBusiness.industry || "new"} business serving ${activeBusiness.target_customer || "a defined customer segment"}. It will compete through a focused offer, measurable customer value, and disciplined execution.`,
      problem: current.problem || `Our target customer needs a better way to solve the core problem described by ${activeBusiness.name}. Customer interviews will quantify urgency, current alternatives, and willingness to pay.`,
      solution: current.solution || activeBusiness.description || `${activeBusiness.name} will deliver a focused product or service designed around the customer's highest-priority outcome.`,
      target_customer: current.target_customer || activeBusiness.target_customer || "Define the primary buyer, geography, purchase trigger, and budget.",
      revenue_model: current.revenue_model || activeBusiness.business_model || "Define unit pricing, purchase frequency, gross margin, and recurring revenue opportunities.",
      milestones: current.milestones || "Validate demand, finalize pricing, acquire the first customers, document delivery, and reach repeatable monthly revenue."
    }));
    setMessage("Starter language added. Replace assumptions with evidence before sharing the plan.");
  };

  const savePlan = async () => {
    if (!activeBusiness) return;
    setSaving("plan");
    const completion = completionFor(plan);
    const { error } = await supabase.from("cf_business_plans").upsert({
      business_id: activeBusiness.id,
      user_id: user.id,
      status: completion === 100 ? "ready" : "draft",
      completion,
      plan,
      updated_at: new Date().toISOString()
    }, { onConflict: "business_id" });
    setMessage(error ? error.message || "Unable to save the plan." : "Business plan saved.");
    setSaving("");
  };

  const saveFinancials = async () => {
    if (!activeBusiness) return;
    setSaving("financials");
    const { error } = await supabase.from("cf_financial_models").upsert({
      business_id: activeBusiness.id,
      user_id: user.id,
      currency: activeBusiness.currency || "USD",
      assumptions: Object.fromEntries(Object.entries(financials).map(([key, value]) => [key, numberValue(value)])),
      outputs: financialOutputs,
      updated_at: new Date().toISOString()
    }, { onConflict: "business_id" });
    setMessage(error ? error.message || "Unable to save the financial model." : "Financial model saved.");
    setSaving("");
  };

  const generateExecutionPlan = async () => {
    if (!activeBusiness) return;
    setSaving("execution");
    const existing = new Set(executionItems.map((item) => item.title));
    const candidates = [
      { source_type: "plan", category: "Validation", title: "Interview 10 target customers", description: "Test the problem, current alternatives, urgency, and willingness to pay.", priority: 5, due_date: daysFromNow(14), metric: "10 completed interviews" },
      { source_type: "plan", category: "Finance", title: "Validate pricing and unit economics", description: "Confirm price, variable cost, gross margin, and break-even volume using real supplier and customer inputs.", priority: 5, due_date: daysFromNow(21), metric: "Positive contribution margin" },
      { source_type: "plan", category: "Go to market", title: "Run the first customer acquisition test", description: "Launch one measurable sales channel with a fixed budget and conversion target.", priority: 4, due_date: daysFromNow(30), metric: "First qualified leads" },
      { source_type: "plan", category: "Operations", title: "Document the delivery process", description: "Write the steps, owners, suppliers, timing, and quality checks required to fulfill one sale.", priority: 3, due_date: daysFromNow(45), metric: "Documented operating checklist" },
      { source_type: "plan", category: "Funding", title: "Prepare the funding package", description: "Complete the business plan, financial model, use-of-funds schedule, and supporting documents.", priority: 4, due_date: daysFromNow(60), metric: "Lender-ready package" }
    ];

    swotList(latestSwot?.weaknesses).slice(0, 2).forEach((item, index) => candidates.push({
      source_type: "swot",
      category: "Risk reduction",
      title: `Reduce weakness: ${item.slice(0, 90)}`,
      description: "Turn this SWOT weakness into a documented corrective action and measurable control.",
      priority: 4,
      due_date: daysFromNow(30 + index * 15),
      metric: "Corrective action completed"
    }));
    swotList(latestSwot?.opportunities).slice(0, 2).forEach((item, index) => candidates.push({
      source_type: "swot",
      category: "Growth",
      title: `Test opportunity: ${item.slice(0, 90)}`,
      description: "Run a low-cost test before committing significant capital.",
      priority: 3,
      due_date: daysFromNow(45 + index * 15),
      metric: "Go/no-go evidence collected"
    }));

    const rows = candidates.filter((item) => !existing.has(item.title)).map((item) => ({
      ...item,
      business_id: activeBusiness.id,
      user_id: user.id,
      status: "todo",
      expected_impact: "Move the business toward validated, repeatable growth.",
      estimated_cost: 0
    }));
    if (!rows.length) {
      setMessage("The core 90-day plan is already in place.");
      setSaving("");
      return;
    }
    const { data, error } = await supabase.from("cf_execution_items").insert(rows).select();
    if (error) setMessage(error.message || "Unable to build the execution plan.");
    else {
      setExecutionItems((current) => [...current, ...(data || [])].sort((a, b) => String(a.due_date).localeCompare(String(b.due_date))));
      setMessage("90-day execution plan created.");
    }
    setSaving("");
  };

  const addTask = async (event) => {
    event.preventDefault();
    if (!activeBusiness || !taskDraft.title.trim()) return;
    setSaving("task");
    const { data, error } = await supabase.from("cf_execution_items").insert({
      business_id: activeBusiness.id,
      user_id: user.id,
      source_type: "manual",
      category: taskDraft.category,
      title: taskDraft.title.trim(),
      due_date: taskDraft.due_date || null,
      status: "todo"
    }).select().single();
    if (error) setMessage(error.message || "Unable to add the action.");
    else {
      setExecutionItems((current) => [...current, data].sort((a, b) => String(a.due_date).localeCompare(String(b.due_date))));
      setTaskDraft({ title: "", category: "Launch", due_date: daysFromNow(30) });
    }
    setSaving("");
  };

  const setTaskStatus = async (item, status) => {
    const { data, error } = await supabase.from("cf_execution_items").update({
      status,
      updated_at: new Date().toISOString()
    }).eq("id", item.id).select().single();
    if (error) setMessage(error.message || "Unable to update the action.");
    else setExecutionItems((current) => current.map((task) => task.id === data.id ? data : task));
  };

  if (loading && !entitlement) {
    return <main className="founder-shell"><p>Loading Founder OS...</p><style>{FOUNDER_STYLES}</style></main>;
  }
  if (!hasAccess) return <FounderGate onBack={onBack} />;

  if (!businesses.length) {
    return (
      <main className="founder-shell">
        <style>{FOUNDER_STYLES}</style>
        <button className="founder-back" onClick={onBack}>Back to workspace</button>
        <section className="founder-onboarding">
          <div>
            <p className="founder-kicker">Founder OS setup</p>
            <h1>Create your business command center.</h1>
            <p>Start with the business facts Chronicle Future will reuse across your plan, financial model, funding preparation, and execution system.</p>
          </div>
          <BusinessForm draft={businessDraft} update={updateBusinessDraft} locations={locations} onSubmit={createBusiness} saving={saving === "business"} submitLabel="Create Founder OS workspace" />
          {message ? <p className="founder-message">{message}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="founder-shell">
      <style>{FOUNDER_STYLES}</style>
      <header className="founder-header">
        <div>
          <button className="founder-back" onClick={onBack}>Back to workspace</button>
          <p className="founder-kicker">Chronicle Future Founder OS</p>
          <h1>{activeBusiness?.name || "Business workspace"}</h1>
        </div>
        <label className="founder-switcher">Active business
          <select value={activeBusinessId} onChange={(event) => setActiveBusinessId(event.target.value)}>
            {businesses.map((business) => <option key={business.id} value={business.id}>{business.name}</option>)}
          </select>
        </label>
      </header>

      <nav className="founder-tabs" aria-label="Founder OS sections">
        {[
          ["overview", "Command center"],
          ["profile", "Business profile"],
          ["plan", "Business plan"],
          ["financials", "Financial model"],
          ["execution", "90-day plan"]
        ].map(([key, label]) => (
          <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{label}</button>
        ))}
      </nav>

      {message ? <p className="founder-message" role="status">{message}</p> : null}
      {loading ? <p className="founder-loading">Loading business data...</p> : null}

      {!loading && tab === "overview" ? (
        <Overview
          business={activeBusiness}
          planCompletion={planCompletion}
          outputs={financialOutputs}
          taskCompletion={taskCompletion}
          taskCount={executionItems.length}
          currency={activeBusiness.currency}
          setTab={setTab}
        />
      ) : null}

      {!loading && tab === "profile" ? (
        <section className="founder-panel">
          <PanelHeading eyebrow="Business foundation" title="One profile powers every decision." copy="Keep these facts current. They become the source of truth for planning, forecasting, and execution." />
          <BusinessForm draft={businessDraft} update={updateBusinessDraft} locations={locations} onSubmit={saveBusiness} saving={saving === "business"} submitLabel="Save business profile" />
        </section>
      ) : null}

      {!loading && tab === "plan" ? (
        <section className="founder-panel">
          <PanelHeading eyebrow="Business Plan Studio" title="Build a plan that survives scrutiny." copy="Complete each section with evidence. Chronicle Future tracks readiness and keeps the plan connected to your financial assumptions." />
          <div className="founder-toolbar">
            <span><strong>{planCompletion}%</strong> complete</span>
            <button className="founder-secondary" onClick={buildStarterPlan}>Build starter draft</button>
            <button className="founder-secondary" onClick={() => window.print()}>Print / save PDF</button>
            <button className="founder-primary" onClick={savePlan} disabled={saving === "plan"}>{saving === "plan" ? "Saving..." : "Save plan"}</button>
          </div>
          <div className="plan-sections">
            {PLAN_SECTIONS.map(([key, label, prompt], index) => (
              <label className="plan-section" key={key}>
                <span><em>{String(index + 1).padStart(2, "0")}</em><strong>{label}</strong><small>{prompt}</small></span>
                <textarea rows={6} value={plan[key] || ""} onChange={(event) => setPlan((current) => ({ ...current, [key]: event.target.value }))} />
              </label>
            ))}
          </div>
        </section>
      ) : null}

      {!loading && tab === "financials" ? (
        <section className="founder-panel">
          <PanelHeading eyebrow="Financial Model Lab" title="Know the volume, cash, and margin required." copy="Change any assumption to recalculate revenue, break-even volume, runway, and the first-year outlook." />
          <div className="financial-layout">
            <div className="financial-inputs">
              {[
                ["startup_costs", "Startup costs", "$"],
                ["monthly_fixed_costs", "Monthly fixed costs", "$"],
                ["unit_price", "Average selling price", "$"],
                ["unit_cost", "Variable cost per sale", "$"],
                ["monthly_units", "Starting monthly sales", "#"],
                ["monthly_growth_rate", "Monthly sales growth", "%"],
                ["cash_on_hand", "Cash available", "$"],
                ["loan_amount", "Planned loan amount", "$"],
                ["annual_interest_rate", "Annual interest rate", "%"],
                ["loan_term_months", "Loan term", "months"]
              ].map(([key, label, unit]) => (
                <label key={key}>{label}<span><small>{unit}</small><input type="number" min="0" step="any" value={financials[key]} onChange={(event) => setFinancials((current) => ({ ...current, [key]: event.target.value }))} /></span></label>
              ))}
              <button className="founder-primary" onClick={saveFinancials} disabled={saving === "financials"}>{saving === "financials" ? "Saving..." : "Save financial model"}</button>
            </div>
            <div className="financial-results">
              <Metric label="Monthly revenue" value={money(financialOutputs.monthly_revenue, activeBusiness.currency)} />
              <Metric label="Monthly operating profit" value={money(financialOutputs.monthly_operating_profit, activeBusiness.currency)} tone={financialOutputs.monthly_operating_profit >= 0 ? "positive" : "negative"} />
              <Metric label="Gross margin" value={`${financialOutputs.gross_margin.toFixed(1)}%`} />
              <Metric label="Break-even sales / month" value={financialOutputs.break_even_units.toLocaleString()} />
              <Metric label="Estimated runway" value={financialOutputs.runway_months === null ? "Cash-generating" : `${financialOutputs.runway_months.toFixed(1)} months`} />
              <Metric label="Year-one revenue" value={money(financialOutputs.year_one_revenue, activeBusiness.currency)} />
              <Metric label="Year-one operating profit" value={money(financialOutputs.year_one_profit, activeBusiness.currency)} tone={financialOutputs.year_one_profit >= 0 ? "positive" : "negative"} />
              <Metric label="Additional startup capital" value={money(financialOutputs.startup_capital_required, activeBusiness.currency)} />
            </div>
          </div>
          <p className="founder-disclaimer">Planning estimates only. Validate tax, accounting, lending, and investment decisions with qualified professionals.</p>
        </section>
      ) : null}

      {!loading && tab === "execution" ? (
        <section className="founder-panel">
          <PanelHeading eyebrow="SWOT to execution" title="Turn intelligence into the next 90 days." copy="Generate a practical operating plan from founder fundamentals and the latest linked location SWOT, then track completion." />
          <div className="founder-toolbar">
            <span><strong>{taskCompletion}%</strong> complete</span>
            <button className="founder-primary" onClick={generateExecutionPlan} disabled={saving === "execution"}>{saving === "execution" ? "Building..." : executionItems.length ? "Refresh core plan" : "Build my 90-day plan"}</button>
          </div>
          <form className="task-form" onSubmit={addTask}>
            <input value={taskDraft.title} onChange={(event) => setTaskDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Add a specific next action" required />
            <select value={taskDraft.category} onChange={(event) => setTaskDraft((current) => ({ ...current, category: event.target.value }))}>
              <option>Launch</option><option>Validation</option><option>Finance</option><option>Growth</option><option>Operations</option><option>Funding</option>
            </select>
            <input type="date" value={taskDraft.due_date} onChange={(event) => setTaskDraft((current) => ({ ...current, due_date: event.target.value }))} />
            <button className="founder-secondary" disabled={saving === "task"}>Add action</button>
          </form>
          <div className="execution-list">
            {executionItems.map((item) => (
              <article className={`execution-item status-${item.status}`} key={item.id}>
                <div>
                  <span>{item.category} / priority {item.priority}</span>
                  <h3>{item.title}</h3>
                  {item.description ? <p>{item.description}</p> : null}
                  {item.metric ? <small>Success measure: {item.metric}</small> : null}
                </div>
                <div>
                  <time>{item.due_date || "No due date"}</time>
                  <select value={item.status} onChange={(event) => setTaskStatus(item, event.target.value)}>
                    <option value="todo">To do</option>
                    <option value="in_progress">In progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </article>
            ))}
            {!executionItems.length ? <p className="founder-empty">No actions yet. Build the core plan or add the first action manually.</p> : null}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function BusinessForm({ draft, update, locations, onSubmit, saving, submitLabel }) {
  return (
    <form className="business-form" onSubmit={onSubmit}>
      <label className="wide">Business name<input value={draft.name} onChange={update("name")} required /></label>
      <label>Stage<select value={draft.stage} onChange={update("stage")}><option value="idea">Idea</option><option value="validation">Validation</option><option value="launch">Launch</option><option value="operating">Operating</option><option value="scaling">Scaling</option></select></label>
      <label>Industry<input value={draft.industry} onChange={update("industry")} placeholder="Healthcare, construction, software..." /></label>
      <label>Business model<input value={draft.business_model} onChange={update("business_model")} placeholder="Service, retail, subscription..." /></label>
      <label>Linked intelligence location<select value={draft.location_id} onChange={update("location_id")}><option value="">No linked location</option>{locations.map((location) => <option value={location.id} key={location.id}>{location.city}, {location.state} {location.zip}</option>)}</select></label>
      <label className="wide">Business description<textarea rows={4} value={draft.description} onChange={update("description")} placeholder="What will the business sell and what outcome will it create?" /></label>
      <label className="wide">Target customer<textarea rows={3} value={draft.target_customer} onChange={update("target_customer")} placeholder="Who buys, where are they, and what triggers the purchase?" /></label>
      <label>Funding needed<input type="number" min="0" value={draft.funding_need} onChange={update("funding_need")} /></label>
      <label>Currency<select value={draft.currency} onChange={update("currency")}><option>USD</option><option>CAD</option><option>EUR</option><option>GBP</option></select></label>
      <label className="wide">Goals, separated by commas<input value={draft.goals} onChange={update("goals")} placeholder="Validate demand, open location, reach $20k MRR" /></label>
      <button className="founder-primary wide" disabled={saving}>{saving ? "Saving..." : submitLabel}</button>
    </form>
  );
}

function PanelHeading({ eyebrow, title, copy }) {
  return <header className="founder-panel-heading"><div><p className="founder-kicker">{eyebrow}</p><h2>{title}</h2></div><p>{copy}</p></header>;
}

function Metric({ label, value, tone = "" }) {
  return <div className={`founder-metric ${tone}`}><span>{label}</span><strong>{value}</strong></div>;
}

function Overview({ business, planCompletion, outputs, taskCompletion, taskCount, currency, setTab }) {
  const readiness = Math.round((planCompletion + Math.min(100, taskCount * 12) + (outputs.monthly_revenue > 0 ? 100 : 0)) / 3);
  return (
    <section className="founder-overview">
      <div className="founder-score">
        <p className="founder-kicker">Founder readiness</p>
        <strong>{readiness}</strong><span>/ 100</span>
        <p>Calculated from planning, financial assumptions, and an active execution system.</p>
      </div>
      <div className="overview-grid">
        <button onClick={() => setTab("profile")}><span>01 / Foundation</span><h2>{business.stage}</h2><p>{business.industry || "Industry not defined"}</p></button>
        <button onClick={() => setTab("plan")}><span>02 / Business plan</span><h2>{planCompletion}%</h2><p>Complete enough detail for customers, partners, and lenders.</p></button>
        <button onClick={() => setTab("financials")}><span>03 / Monthly break-even</span><h2>{outputs.break_even_units.toLocaleString()}</h2><p>Sales required at the current price and cost assumptions.</p></button>
        <button onClick={() => setTab("execution")}><span>04 / Execution</span><h2>{taskCompletion}%</h2><p>{taskCount} tracked actions in the operating plan.</p></button>
      </div>
      <div className="funding-readiness">
        <div><p className="founder-kicker">Funding snapshot</p><h2>{money(business.funding_need, currency)} requested</h2></div>
        <p>{planCompletion >= 80 && outputs.year_one_revenue > 0 ? "Core planning materials are taking shape. Validate assumptions and assemble supporting documents before approaching lenders." : "Complete the business plan and financial model before approaching lenders or investors."}</p>
        <a href="https://www.sba.gov/funding-programs/loans/lender-match-connects-you-lenders" target="_blank" rel="noreferrer">Open SBA Lender Match</a>
      </div>
    </section>
  );
}

const FOUNDER_STYLES = `
  .founder-shell { max-width: 1240px; min-height: 70vh; margin: auto; padding: clamp(32px, 5vw, 68px) var(--gutter); color: var(--ink); }
  .founder-back { border: 0; background: none; color: var(--green); padding: 0; font-weight: 800; }
  .founder-kicker { margin: 0 0 9px; color: var(--green); font-size: 10px; font-weight: 900; letter-spacing: .15em; text-transform: uppercase; }
  .founder-header { display: flex; justify-content: space-between; align-items: end; gap: 30px; border-bottom: 1px solid var(--line); padding-bottom: 24px; }
  .founder-header h1, .founder-onboarding h1, .founder-gate h1 { margin: 18px 0 0; font-size: clamp(38px, 6vw, 68px); line-height: 1; }
  .founder-switcher { min-width: 240px; }
  .founder-switcher select, .business-form input, .business-form textarea, .business-form select, .plan-section textarea, .financial-inputs input, .task-form input, .task-form select, .execution-item select { width: 100%; border: 1px solid var(--line-strong); border-radius: 3px; background: #fff; padding: 11px; color: var(--ink); }
  .founder-tabs { display: flex; gap: 0; overflow-x: auto; border-bottom: 1px solid var(--line); margin-bottom: 30px; }
  .founder-tabs button { border: 0; border-bottom: 3px solid transparent; background: none; padding: 16px 18px 13px; white-space: nowrap; color: var(--ink-3); font-size: 12px; font-weight: 800; }
  .founder-tabs button.active { border-bottom-color: var(--green); color: var(--green); }
  .founder-message { border-left: 3px solid var(--green); background: #e9f4f9; padding: 12px 16px; color: var(--ink-2); font-weight: 700; }
  .founder-loading, .founder-empty { color: var(--ink-3); }
  .founder-primary, .founder-secondary { display: inline-flex; justify-content: center; border-radius: 3px; padding: 11px 16px; font-weight: 800; }
  .founder-primary { border: 1px solid var(--green); background: var(--green); color: #fff; }
  .founder-secondary { border: 1px solid var(--green); background: transparent; color: var(--green); }
  .founder-primary:disabled, .founder-secondary:disabled { opacity: .55; }
  .founder-panel { border: 1px solid var(--line); background: var(--paper-2); padding: clamp(22px, 4vw, 38px); }
  .founder-panel-heading { display: grid; grid-template-columns: 1fr minmax(260px, 430px); gap: 30px; align-items: end; border-bottom: 1px solid var(--line); padding-bottom: 24px; margin-bottom: 26px; }
  .founder-panel-heading h2 { margin: 0; font-size: clamp(28px, 4vw, 42px); }
  .founder-panel-heading > p { margin: 0; color: var(--ink-3); line-height: 1.55; }
  .founder-toolbar { display: flex; justify-content: flex-end; align-items: center; gap: 10px; flex-wrap: wrap; border-bottom: 1px solid var(--line-soft); padding-bottom: 18px; margin-bottom: 20px; }
  .founder-toolbar > span { margin-right: auto; color: var(--ink-3); }
  .founder-toolbar > span strong { color: var(--green); font-family: var(--serif); font-size: 28px; }
  .business-form { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; border: 1px solid var(--line); background: #fff; padding: clamp(20px, 3vw, 30px); }
  .business-form label { display: grid; align-content: start; }
  .business-form .wide { grid-column: 1 / -1; }
  .founder-onboarding { display: grid; grid-template-columns: .8fr 1.2fr; gap: clamp(30px, 6vw, 70px); align-items: start; margin-top: 30px; }
  .founder-onboarding > div > p:last-child, .founder-gate section > p { color: var(--ink-2); font-size: 17px; line-height: 1.6; }
  .founder-gate section { max-width: 760px; border-top: 4px solid var(--green); margin: 40px auto; background: #fff; padding: clamp(28px, 5vw, 56px); }
  .founder-gate .founder-primary { margin-top: 18px; }
  .plan-sections { display: grid; gap: 12px; }
  .plan-section { display: grid; grid-template-columns: 260px 1fr; gap: 22px; border-top: 1px solid var(--line-soft); padding-top: 18px; }
  .plan-section > span { display: grid; align-content: start; gap: 5px; }
  .plan-section em { color: var(--ink-4); font-family: var(--serif); font-size: 24px; font-style: normal; }
  .plan-section strong { font-family: var(--serif); font-size: 19px; }
  .plan-section small { color: var(--ink-3); line-height: 1.45; }
  .plan-section textarea { resize: vertical; line-height: 1.55; }
  .financial-layout { display: grid; grid-template-columns: minmax(280px, .8fr) 1.2fr; gap: 30px; }
  .financial-inputs { display: grid; gap: 12px; border-right: 1px solid var(--line); padding-right: 30px; }
  .financial-inputs label > span { display: grid; grid-template-columns: 34px 1fr; align-items: center; margin-top: 6px; border: 1px solid var(--line-strong); background: #fff; }
  .financial-inputs label small { text-align: center; color: var(--ink-4); }
  .financial-inputs input { margin: 0; border: 0; border-left: 1px solid var(--line-soft); }
  .financial-results { display: grid; grid-template-columns: repeat(2, 1fr); border-top: 1px solid var(--line); border-left: 1px solid var(--line); }
  .founder-metric { min-height: 130px; display: grid; align-content: space-between; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); padding: 18px; background: #fff; }
  .founder-metric span { color: var(--ink-3); font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
  .founder-metric strong { font-family: var(--serif); font-size: clamp(24px, 3vw, 34px); }
  .founder-metric.positive strong { color: var(--up); }
  .founder-metric.negative strong { color: var(--down); }
  .founder-disclaimer { margin: 18px 0 0; color: var(--ink-4); font-size: 11px; }
  .task-form { display: grid; grid-template-columns: 1fr 150px 150px auto; gap: 10px; margin-bottom: 20px; }
  .execution-list { display: grid; }
  .execution-item { display: grid; grid-template-columns: 1fr 160px; gap: 24px; border-top: 1px solid var(--line); padding: 20px 0; }
  .execution-item > div:first-child > span { color: var(--green); font-size: 10px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
  .execution-item h3 { margin: 7px 0; font-size: 20px; }
  .execution-item p { margin: 0 0 8px; color: var(--ink-2); line-height: 1.5; }
  .execution-item small, .execution-item time { color: var(--ink-4); }
  .execution-item > div:last-child { display: grid; align-content: start; gap: 9px; }
  .execution-item.status-done { opacity: .6; }
  .execution-item.status-done h3 { text-decoration: line-through; }
  .founder-overview { display: grid; grid-template-columns: 260px 1fr; gap: 24px; }
  .founder-score { display: block; border: 1px solid var(--line); border-top: 4px solid var(--green); background: #fff; padding: 26px; }
  .founder-score > strong { font-family: var(--serif); font-size: 76px; font-weight: 600; }
  .founder-score > span { color: var(--ink-4); }
  .founder-score > p:last-child { color: var(--ink-3); line-height: 1.5; }
  .overview-grid { display: grid; grid-template-columns: repeat(2, 1fr); border-top: 1px solid var(--line); border-left: 1px solid var(--line); }
  .overview-grid button { min-height: 180px; border: 0; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); background: #fff; padding: 22px; text-align: left; }
  .overview-grid button:hover { background: #edf6fa; }
  .overview-grid span { color: var(--green); font-size: 10px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
  .overview-grid h2 { margin: 24px 0 5px; font-size: 32px; text-transform: capitalize; }
  .overview-grid p { margin: 0; color: var(--ink-3); }
  .funding-readiness { grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1.5fr auto; gap: 26px; align-items: center; border: 1px solid var(--line); background: var(--green-deep); color: #fff; padding: 24px; }
  .funding-readiness h2 { margin: 0; color: #fff; }
  .funding-readiness > p { margin: 0; color: #d4e8f1; line-height: 1.5; }
  .funding-readiness a { color: var(--lime-soft); font-weight: 800; white-space: nowrap; }
  @media (max-width: 900px) {
    .founder-header, .founder-panel-heading, .founder-onboarding, .financial-layout, .founder-overview { grid-template-columns: 1fr; display: grid; }
    .founder-switcher { min-width: 0; }
    .financial-inputs { border-right: 0; border-bottom: 1px solid var(--line); padding: 0 0 24px; }
    .founder-score { grid-column: auto; }
    .funding-readiness { grid-template-columns: 1fr; }
    .task-form { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 600px) {
    .business-form, .financial-results, .overview-grid { grid-template-columns: 1fr; }
    .business-form .wide { grid-column: auto; }
    .plan-section, .execution-item { grid-template-columns: 1fr; }
    .task-form { grid-template-columns: 1fr; }
    .founder-tabs button { padding-inline: 12px; }
  }
  @media print {
    .header-stack, .founder-tabs, .founder-back, .founder-toolbar, .founder-message { display: none !important; }
    .founder-shell { padding: 0; }
    .founder-panel { border: 0; padding: 0; }
    .plan-section { break-inside: avoid; }
  }
`;
