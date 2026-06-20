const FRED_CSV_URL = "https://fred.stlouisfed.org/graph/fredgraph.csv";
const CENSUS_ACS_YEAR = process.env.CENSUS_ACS_YEAR || "2023";
const CENSUS_ACS_URL = `https://api.census.gov/data/${CENSUS_ACS_YEAR}/acs/acs5`;
const BLS_PUBLIC_URL = "https://api.bls.gov/publicAPI/v2/timeseries/data";

function signal({ scope, category, source, title, detail, metric, value, unit, observedAt, geography }) {
  return {
    scope,
    category,
    source,
    title,
    detail,
    metric,
    value,
    unit,
    observed_at: observedAt,
    geography
  };
}

function latestNumericObservation(rows, column) {
  return rows
    .slice(1)
    .map((row) => ({ date: row[0], value: Number(row[column]) }))
    .filter((row) => Number.isFinite(row.value))
    .at(-1);
}

function parseCsv(text) {
  return text.trim().split("\n").map((line) => line.split(",").map((cell) => cell.trim()));
}

async function fetchFredSeries(seriesId) {
  const url = `${FRED_CSV_URL}?id=${encodeURIComponent(seriesId)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`FRED ${seriesId} failed`);
  const rows = parseCsv(await response.text());
  return latestNumericObservation(rows, 1);
}

async function fetchCensusZipProfile(location) {
  const zip = String(location.zip || "").trim();
  if (!zip) return [];

  const params = new URLSearchParams({
    get: "NAME,B01003_001E,B19013_001E,B15003_022E,B15003_023E,B15003_024E,B15003_025E",
    for: `zip code tabulation area:${zip}`
  });
  const response = await fetch(`${CENSUS_ACS_URL}?${params.toString()}`);
  if (!response.ok) throw new Error("Census ACS ZIP profile failed");
  const [headers, values] = await response.json();
  if (!headers || !values) return [];

  const row = Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  const population = Number(row.B01003_001E);
  const income = Number(row.B19013_001E);
  const degreeHolders = ["B15003_022E", "B15003_023E", "B15003_024E", "B15003_025E"].reduce((sum, key) => sum + Number(row[key] || 0), 0);

  return [
    signal({
      scope: "local",
      category: "local signals",
      source: "census_acs5",
      title: "ZIP population base",
      detail: `${row.NAME} reports an estimated population of ${population.toLocaleString()} residents, defining the immediate demand and workforce base around ${location.city}.`,
      metric: "population",
      value: population,
      unit: "people",
      geography: row.NAME
    }),
    signal({
      scope: "local",
      category: "local signals",
      source: "census_acs5",
      title: "Household income signal",
      detail: `Median household income is approximately $${income.toLocaleString()}, a useful proxy for local purchasing power and pricing tolerance.`,
      metric: "median_household_income",
      value: income,
      unit: "usd",
      geography: row.NAME
    }),
    signal({
      scope: "local",
      category: "technology watch",
      source: "census_acs5",
      title: "Degree-holder talent pool",
      detail: `${degreeHolders.toLocaleString()} residents in the ZIP hold a bachelor's degree or higher, indicating the local depth for knowledge-work and technology adoption.`,
      metric: "bachelors_or_higher",
      value: degreeHolders,
      unit: "people",
      geography: row.NAME
    })
  ].filter((item) => Number.isFinite(item.value));
}

async function fetchFredEconomicSignals(location) {
  const [unemployment, mortgageRate, oil, copper] = await Promise.allSettled([
    fetchFredSeries("UNRATE"),
    fetchFredSeries("MORTGAGE30US"),
    fetchFredSeries("DCOILWTICO"),
    fetchFredSeries("PCOPPUSDM")
  ]);

  const output = [];
  if (unemployment.status === "fulfilled" && unemployment.value) {
    output.push(signal({
      scope: "national",
      category: "national signals",
      source: "fred",
      title: "National unemployment rate",
      detail: `The latest FRED unemployment reading is ${unemployment.value.value.toFixed(1)}%, setting the baseline for labor availability and wage pressure in ${location.city}.`,
      metric: "UNRATE",
      value: unemployment.value.value,
      unit: "percent",
      observedAt: unemployment.value.date,
      geography: "United States"
    }));
  }
  if (mortgageRate.status === "fulfilled" && mortgageRate.value) {
    output.push(signal({
      scope: "national",
      category: "state signals",
      source: "fred",
      title: "Interest-rate pressure on local projects",
      detail: `The 30-year mortgage rate is ${mortgageRate.value.value.toFixed(2)}%, influencing housing feasibility, small-business borrowing, and regional development costs.`,
      metric: "MORTGAGE30US",
      value: mortgageRate.value.value,
      unit: "percent",
      observedAt: mortgageRate.value.date,
      geography: location.state
    }));
  }
  if (oil.status === "fulfilled" && oil.value) {
    output.push(signal({
      scope: "commodity",
      category: "commodity signals",
      source: "fred",
      title: "Oil cost input",
      detail: `WTI crude is near $${oil.value.value.toFixed(2)}, a direct operating-cost signal for logistics, agriculture, construction, and consumer energy exposure.`,
      metric: "DCOILWTICO",
      value: oil.value.value,
      unit: "usd_per_barrel",
      observedAt: oil.value.date,
      geography: "Global commodity market"
    }));
  }
  if (copper.status === "fulfilled" && copper.value) {
    output.push(signal({
      scope: "commodity",
      category: "commodity signals",
      source: "fred",
      title: "Copper construction and electrification input",
      detail: `Copper is approximately $${copper.value.value.toFixed(2)} per metric ton index unit, flagging cost pressure for electrical infrastructure and building activity.`,
      metric: "PCOPPUSDM",
      value: copper.value.value,
      unit: "usd",
      observedAt: copper.value.date,
      geography: "Global commodity market"
    }));
  }

  return output;
}

async function fetchBlsEmploymentSignals(location) {
  const now = new Date();
  const endYear = now.getUTCFullYear();
  const startYear = endYear - 1;
  const response = await fetch(BLS_PUBLIC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      seriesid: ["CES0000000001", "CES6054150001"],
      startyear: String(startYear),
      endyear: String(endYear)
    })
  });
  if (!response.ok) throw new Error("BLS employment trends failed");
  const payload = await response.json();
  const series = payload?.Results?.series || [];

  return series.flatMap((item) => {
    const latest = item.data?.[0];
    if (!latest) return [];
    const isTechProxy = item.seriesID === "CES6054150001";
    return signal({
      scope: isTechProxy ? "technology" : "national",
      category: isTechProxy ? "technology signals" : "national signals",
      source: "bls",
      title: isTechProxy ? "Professional and technical employment trend" : "Total nonfarm employment trend",
      detail: `${latest.periodName} ${latest.year} BLS employment is ${Number(latest.value).toLocaleString()} thousand, providing a labor-market trend input for ${location.city}.`,
      metric: item.seriesID,
      value: Number(latest.value),
      unit: "thousand_jobs",
      observedAt: `${latest.year}-${latest.period.replace("M", "").padStart(2, "0")}`,
      geography: "United States"
    });
  });
}

function groupSignals(signals) {
  return signals.reduce((groups, item) => {
    if (item.category === "local signals") groups.local_signals.push(item);
    else if (item.category === "state signals") groups.state_signals.push(item);
    else if (item.category === "national signals") groups.national_signals.push(item);
    else if (item.category === "technology signals" || item.category === "technology watch") groups.technology_signals.push(item);
    else if (item.category === "commodity signals" || item.category === "commodity watch") groups.commodity_signals.push(item);
    return groups;
  }, {
    local_signals: [],
    state_signals: [],
    national_signals: [],
    technology_signals: [],
    commodity_signals: []
  });
}

export const signalSources = [
  { id: "census_demographics", name: "Census demographics", load: fetchCensusZipProfile },
  { id: "fred_economic_indicators", name: "FRED economic indicators", load: fetchFredEconomicSignals },
  { id: "bls_employment_trends", name: "BLS employment trends", load: fetchBlsEmploymentSignals }
];

export async function ingestSignals(location, sources = signalSources) {
  const settled = await Promise.allSettled(sources.map((source) => source.load(location)));
  const signals = settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));

  return {
    ...groupSignals(signals),
    metadata: {
      location: { city: location.city, state: location.state, zip: location.zip },
      source_count: sources.length,
      failed_sources: settled
        .map((result, index) => (result.status === "rejected" ? { id: sources[index].id, error: result.reason?.message || "Unknown error" } : null))
        .filter(Boolean),
      generated_at: new Date().toISOString()
    }
  };
}

export function flattenSignalSet(signalSet) {
  return [
    ...normalize(signalSet.local_signals),
    ...normalize(signalSet.state_signals),
    ...normalize(signalSet.national_signals),
    ...normalize(signalSet.technology_signals),
    ...normalize(signalSet.commodity_signals)
  ];
}

function normalize(value) {
  return Array.isArray(value) ? value : [];
}
