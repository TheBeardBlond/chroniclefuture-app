import { XMLParser } from "fast-xml-parser";

const MARKET_INDEXES = [
  { symbol: "^GSPC", label: "S&P 500", type: "index" },
  { symbol: "^DJI", label: "Dow", type: "index" },
  { symbol: "^IXIC", label: "Nasdaq", type: "index" },
  { symbol: "^RUT", label: "Russell 2000", type: "index" }
];

const COMPANIES = [
  { symbol: "WMT", label: "Walmart", type: "company" },
  { symbol: "AMZN", label: "Amazon", type: "company" },
  { symbol: "AAPL", label: "Apple", type: "company" },
  { symbol: "UNH", label: "UnitedHealth", type: "company" },
  { symbol: "BRK-B", label: "Berkshire", type: "company" },
  { symbol: "CVS", label: "CVS Health", type: "company" },
  { symbol: "XOM", label: "Exxon Mobil", type: "company" },
  { symbol: "GOOGL", label: "Alphabet", type: "company" },
  { symbol: "COST", label: "Costco", type: "company" },
  { symbol: "MSFT", label: "Microsoft", type: "company" },
  { symbol: "CVX", label: "Chevron", type: "company" },
  { symbol: "HD", label: "Home Depot", type: "company" },
  { symbol: "JPM", label: "JPMorgan", type: "company" },
  { symbol: "META", label: "Meta", type: "company" },
  { symbol: "NVDA", label: "Nvidia", type: "company" },
  { symbol: "F", label: "Ford", type: "company" },
  { symbol: "GM", label: "GM", type: "company" },
  { symbol: "CAT", label: "Caterpillar", type: "company" }
];

const COMMODITIES = [
  { symbol: "GC=F", label: "Gold", type: "commodity" },
  { symbol: "SI=F", label: "Silver", type: "commodity" },
  { symbol: "HG=F", label: "Copper", type: "commodity" },
  { symbol: "PL=F", label: "Platinum", type: "commodity" },
  { symbol: "PA=F", label: "Palladium", type: "commodity" },
  { symbol: "CL=F", label: "WTI Oil", type: "commodity" },
  { symbol: "BZ=F", label: "Brent Oil", type: "commodity" },
  { symbol: "NG=F", label: "Natural Gas", type: "commodity" },
  { symbol: "RB=F", label: "Gasoline", type: "commodity" },
  { symbol: "HO=F", label: "Heating Oil", type: "commodity" },
  { symbol: "ZC=F", label: "Corn", type: "commodity" },
  { symbol: "ZW=F", label: "Wheat", type: "commodity" },
  { symbol: "ZS=F", label: "Soybeans", type: "commodity" },
  { symbol: "KC=F", label: "Coffee", type: "commodity" },
  { symbol: "SB=F", label: "Sugar", type: "commodity" },
  { symbol: "CC=F", label: "Cocoa", type: "commodity" },
  { symbol: "CT=F", label: "Cotton", type: "commodity" },
  { symbol: "LE=F", label: "Live Cattle", type: "commodity" }
];

const NEWS_SEARCHES = [
  {
    kind: "breaking",
    query: "breaking (economy OR markets OR oil OR commodities OR technology OR geopolitics) when:2h -sports -NFL -NBA -NHL -MLB"
  },
  {
    kind: "latest",
    query: "global economy financial markets commodities energy trade policy technology geopolitics when:12h -sports"
  }
];

const TRUSTED_NEWS_SOURCES = [
  "Reuters", "Associated Press", "AP News", "Bloomberg", "CNBC", "Financial Times",
  "The Wall Street Journal", "The New York Times", "BBC", "NPR", "Axios", "Politico",
  "MarketWatch", "Barron's", "Fortune", "Forbes", "The Guardian", "Washington Post",
  "CBS News", "NBC News", "ABC News", "CNN", "Al Jazeera", "Nikkei Asia", "TechCrunch",
  "The Verge", "WIRED"
];

const EXCLUDED_NEWS_PATTERNS = [
  /\b(nba|nfl|nhl|mlb|ncaa)\b/i,
  /\b(football|basketball|baseball|hockey|soccer|playoffs?)\b/i,
  /\b(trade rumor|offseason|free agent|quarterback|touchdown)\b/i,
  /\b(bucks|celtics|ravens|yankees|lakers)\b/i,
  /\b(comet|asteroid|horoscope|celebrity|box office)\b/i
];

const RELEVANT_NEWS_PATTERNS = [
  /\b(economy|economic|gdp|inflation|recession|employment|jobs|labor)\b/i,
  /\b(market|markets|stock|stocks|shares|equities|bond|bonds|treasury|earnings)\b/i,
  /\b(federal reserve|\bfed\b|central bank|interest rate|rate hike|rate cut)\b/i,
  /\b(oil|gas|energy|power|electricity|commodity|commodities)\b/i,
  /\b(gold|silver|copper|lithium|uranium|wheat|corn|soybeans|cocoa|coffee|fertili[sz]er)\b/i,
  /\b(tariff|sanction|trade war|supply chain|shipping|manufacturing)\b/i,
  /\b(technology|artificial intelligence|\bAI\b|semiconductor|chip|chips|data center)\b/i,
  /\b(geopolitic|war|conflict|nato|china|russia|iran|israel|europe|middle east)\b/i,
  /\b(dollar|currency|yuan|euro|bitcoin|crypto|financial)\b/i
];

async function fetchQuote(instrument) {
  const url = new URL("https://query1.finance.yahoo.com/v8/finance/chart/" + encodeURIComponent(instrument.symbol));
  url.searchParams.set("interval", "1d");
  url.searchParams.set("range", "5d");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "ChronicleFuture/1.0"
    },
    signal: AbortSignal.timeout(6500)
  });
  if (!response.ok) throw new Error("Quote source returned " + response.status + ".");

  const payload = await response.json();
  const result = payload?.chart?.result?.[0];
  const meta = result?.meta;
  const closes = (result?.indicators?.quote?.[0]?.close || []).filter(Number.isFinite);
  const price = Number(meta?.regularMarketPrice ?? closes.at(-1));
  const previousClose = Number(meta?.chartPreviousClose ?? meta?.previousClose ?? closes.at(-2));
  if (!Number.isFinite(price)) throw new Error("Quote source returned no price.");

  const changePercent = Number.isFinite(previousClose) && previousClose !== 0
    ? ((price - previousClose) / previousClose) * 100
    : null;

  return {
    ...instrument,
    price,
    change_percent: Number.isFinite(changePercent) ? changePercent : null,
    currency: meta?.currency || "USD",
    market_time: meta?.regularMarketTime
      ? new Date(meta.regularMarketTime * 1000).toISOString()
      : null
  };
}

function buildNewsUrl(query) {
  const url = new URL("https://news.google.com/rss/search");
  url.searchParams.set("q", query);
  url.searchParams.set("hl", "en-US");
  url.searchParams.set("gl", "US");
  url.searchParams.set("ceid", "US:en");
  return url;
}

function readNewsSource(article) {
  return typeof article?.source === "string"
    ? article.source
    : article?.source?.["#text"] || "News source";
}

function parsePublishedAt(value) {
  const timestamp = Date.parse(value || "");
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function isTrustedSource(source) {
  const normalized = String(source || "").toLowerCase();
  return TRUSTED_NEWS_SOURCES.some((trusted) => normalized.includes(trusted.toLowerCase()));
}

function isRelevantHeadline(title) {
  const value = String(title || "");
  if (EXCLUDED_NEWS_PATTERNS.some((pattern) => pattern.test(value))) return false;
  return RELEVANT_NEWS_PATTERNS.some((pattern) => pattern.test(value));
}

async function fetchNewsSearch(search) {
  const response = await fetch(buildNewsUrl(search.query), {
    headers: { "User-Agent": "ChronicleFuture/1.0" },
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error("News source returned " + response.status + ".");

  const xml = await response.text();
  const payload = new XMLParser({ ignoreAttributes: false, trimValues: true }).parse(xml);
  const items = payload?.rss?.channel?.item;
  const articles = Array.isArray(items) ? items : items ? [items] : [];

  return articles.slice(0, 20).flatMap((article) => {
    if (!article?.title || !/^https?:\/\//.test(article?.link || "")) return [];

    const title = String(article.title).slice(0, 220);
    const source = readNewsSource(article);
    if (!isRelevantHeadline(title)) return [];

    const publishedAt = parsePublishedAt(article.pubDate);
    const ageMs = publishedAt ? Date.now() - Date.parse(publishedAt) : Number.POSITIVE_INFINITY;
    const trusted = isTrustedSource(source);
    const breaking = search.kind === "breaking"
      && trusted
      && ageMs >= 0
      && ageMs <= 2 * 60 * 60 * 1000;

    return [{
      title,
      url: article.link,
      source,
      published_at: publishedAt,
      breaking,
      trusted
    }];
  });
}

function normalizeHeadline(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/\s+-\s+[^-]+$/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function fetchHeadlines() {
  const results = await Promise.allSettled(NEWS_SEARCHES.map(fetchNewsSearch));
  const seen = new Set();

  return results
    .flatMap((result, index) => {
      if (result.status === "fulfilled") return result.value;
      console.error("market-feed news " + NEWS_SEARCHES[index].kind + ":", result.reason?.message || "Unknown error");
      return [];
    })
    .filter((article) => {
      const key = normalizeHeadline(article.title);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((left, right) => {
      if (left.breaking !== right.breaking) return left.breaking ? -1 : 1;
      if (left.trusted !== right.trusted) return left.trusted ? -1 : 1;
      return Date.parse(right.published_at || 0) - Date.parse(left.published_at || 0);
    })
    .slice(0, 12)
    .map(({ trusted, ...article }) => article);
}

async function fetchQuoteGroup(instruments, groupName) {
  const results = await Promise.allSettled(instruments.map(fetchQuote));
  return results.flatMap((result, index) => {
    if (result.status === "fulfilled") return [result.value];
    console.error(
      "market-feed " + groupName + " " + instruments[index].symbol + ":",
      result.reason?.message || "Unknown error"
    );
    return [];
  });
}

export default async function handler(request, response) {
  if (request.method !== "GET") return response.status(405).json({ error: "Method not allowed." });

  response.setHeader("Cache-Control", "public, s-maxage=90, stale-while-revalidate=300");

  const [markets, companies, commodities, news] = await Promise.all([
    fetchQuoteGroup(MARKET_INDEXES, "index"),
    fetchQuoteGroup(COMPANIES, "company"),
    fetchQuoteGroup(COMMODITIES, "commodity"),
    fetchHeadlines().catch((error) => {
      console.error("market-feed news:", error.message);
      return [];
    })
  ]);

  return response.status(200).json({
    markets,
    companies,
    commodities,
    news,
    market: [...markets, ...companies],
    delayed: true,
    as_of: new Date().toISOString()
  });
}
