import { XMLParser } from "fast-xml-parser";

const INSTRUMENTS = [
  { symbol: "^GSPC", label: "S&P 500", type: "index" },
  { symbol: "^DJI", label: "Dow", type: "index" },
  { symbol: "^IXIC", label: "Nasdaq", type: "index" },
  { symbol: "GC=F", label: "Gold", type: "commodity" },
  { symbol: "CL=F", label: "WTI Oil", type: "commodity" },
  { symbol: "HG=F", label: "Copper", type: "commodity" }
];

async function fetchQuote(instrument) {
  const url = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(instrument.symbol)}`);
  url.searchParams.set("interval", "1d");
  url.searchParams.set("range", "5d");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "ChronicleFuture/1.0"
    },
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error(`Quote source returned ${response.status}.`);

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

function buildNewsUrl() {
  const url = new URL("https://news.google.com/rss/search");
  url.searchParams.set("q", "global economy OR financial markets OR commodities");
  url.searchParams.set("hl", "en-US");
  url.searchParams.set("gl", "US");
  url.searchParams.set("ceid", "US:en");
  return url;
}

async function fetchHeadlines() {
  const response = await fetch(buildNewsUrl(), {
    headers: { "User-Agent": "ChronicleFuture/1.0" },
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error(`News source returned ${response.status}.`);

  const xml = await response.text();
  const payload = new XMLParser({ ignoreAttributes: false, trimValues: true }).parse(xml);
  const items = payload?.rss?.channel?.item;
  const articles = Array.isArray(items) ? items : items ? [items] : [];
  const seen = new Set();
  return articles
    .filter((article) => {
      if (!article?.title || !/^https?:\/\//.test(article?.link || "") || seen.has(article.link)) return false;
      seen.add(article.link);
      return true;
    })
    .slice(0, 5)
    .map((article) => ({
      title: String(article.title).slice(0, 180),
      url: article.link,
      source: typeof article.source === "string" ? article.source : article.source?.["#text"] || "News source"
    }));
}

export default async function handler(request, response) {
  if (request.method !== "GET") return response.status(405).json({ error: "Method not allowed." });

  response.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=900");

  const [quoteResults, newsResult] = await Promise.all([
    Promise.allSettled(INSTRUMENTS.map(fetchQuote)),
    fetchHeadlines().catch((error) => {
      console.error("market-feed news:", error.message);
      return [];
    })
  ]);

  const market = quoteResults.flatMap((result, index) => {
    if (result.status === "fulfilled") return [result.value];
    console.error(`market-feed quote ${INSTRUMENTS[index].symbol}:`, result.reason?.message || "Unknown error");
    return [];
  });

  return response.status(200).json({
    market,
    news: newsResult,
    delayed: true,
    as_of: new Date().toISOString()
  });
}
