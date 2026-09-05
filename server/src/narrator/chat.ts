import { prisma } from "../db/client";
import { SECTOR_MAP, DEMO_SYMBOLS } from "../ingestion/seedData";

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
const GEMINI_TIMEOUT_MS = 6000;

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

// --- The only functions Gemini (or the fallback) is allowed to call. Each
// reads from our own already-computed data — never raw prices, never
// free-form DB access. ---

async function getAttentionScore(symbol: string) {
  const s = await prisma.stockSnapshot.findUnique({ where: { symbol: symbol.toUpperCase() } });
  if (!s) return { error: `no data for ${symbol}` };
  return {
    symbol: s.symbol,
    attentionScore: s.attentionScore,
    changePct: Number((((s.price - s.prevClose) / s.prevClose) * 100).toFixed(2)),
    is52wHigh: s.is52wHigh,
    is52wLow: s.is52wLow,
    stale: s.stale,
  };
}

async function getUnusualStocks(minScore = 55) {
  const snapshots = await prisma.stockSnapshot.findMany({ where: { attentionScore: { gte: minScore } } });
  return snapshots.map((s: any) => ({ symbol: s.symbol, attentionScore: s.attentionScore }));
}

async function getWatchlistSummary(watchlistId: string) {
  const stocks = await prisma.watchlistStock.findMany({ where: { watchlistId } });
  const snapshots = await prisma.stockSnapshot.findMany({ where: { symbol: { in: stocks.map((s: any) => s.symbol) } } });
  const avg = snapshots.length ? snapshots.reduce((a: number, s: any) => a + s.attentionScore, 0) / snapshots.length : 0;
  return {
    totalStocks: stocks.length,
    holdings: stocks.filter((s: any) => s.isHolding).map((s: any) => s.symbol),
    watching: stocks.filter((s: any) => !s.isHolding).map((s: any) => s.symbol),
    averageAttention: Math.round(avg),
    needingAttention: snapshots.filter((s: any) => s.attentionScore >= 55).map((s: any) => s.symbol),
  };
}

async function getSectorExposure(watchlistId: string) {
  const stocks = await prisma.watchlistStock.findMany({ where: { watchlistId, isHolding: true } });
  const bySector: Record<string, string[]> = {};
  for (const s of stocks) {
    const sector = SECTOR_MAP[s.symbol] ?? "other";
    (bySector[sector] ??= []).push(s.symbol);
  }
  return Object.entries(bySector)
    .map(([sector, symbols]) => ({ sector, symbols, pct: Math.round((symbols.length / Math.max(1, stocks.length)) * 100) }))
    .sort((a, b) => b.pct - a.pct);
}

async function get52wExtremes(direction: "high" | "low") {
  const snapshots = await prisma.stockSnapshot.findMany({
    where: direction === "high" ? { is52wHigh: true } : { is52wLow: true },
  });
  return snapshots.map((s: any) => s.symbol);
}

const TOOLS = [
  {
    functionDeclarations: [
      {
        name: "getAttentionScore",
        description: "Get the current attention score, price change, and 52-week flags for one stock symbol.",
        parameters: {
          type: "object",
          properties: { symbol: { type: "string", description: "Stock symbol, e.g. RELIANCE" } },
          required: ["symbol"],
        },
      },
      {
        name: "getUnusualStocks",
        description: "List stocks whose attention score is at or above a threshold (default 55).",
        parameters: { type: "object", properties: { minScore: { type: "number" } } },
      },
      {
        name: "getWatchlistSummary",
        description: "Get a summary: total stocks, which are held vs watched, average attention, which need attention.",
        parameters: { type: "object", properties: {} },
      },
      {
        name: "getSectorExposure",
        description: "Get sector concentration breakdown across the user's holdings (not watch-only stocks).",
        parameters: { type: "object", properties: {} },
      },
      {
        name: "get52wExtremes",
        description: "List symbols currently at a 52-week high or 52-week low.",
        parameters: {
          type: "object",
          properties: { direction: { type: "string", enum: ["high", "low"] } },
          required: ["direction"],
        },
      },
    ],
  },
];

async function executeFunctionCall(name: string, args: any, watchlistId: string) {
  switch (name) {
    case "getAttentionScore":
      return getAttentionScore(args.symbol);
    case "getUnusualStocks":
      return getUnusualStocks(args.minScore);
    case "getWatchlistSummary":
      return getWatchlistSummary(watchlistId);
    case "getSectorExposure":
      return getSectorExposure(watchlistId);
    case "get52wExtremes":
      return get52wExtremes(args.direction);
    default:
      return { error: "unknown function" };
  }
}

// --- Rule-based fallback: no LLM, so answers are template sentences, not
// generated language — but it now recognizes far more question shapes
// instead of collapsing everything into one of two replies. ---
async function fallbackChat(message: string, watchlistId: string): Promise<string> {
  const lower = message.toLowerCase().trim();

  if (/^(hi|hello|hey)\b/.test(lower)) {
    return "Hi — ask me things like \"which stocks need attention\", \"summary\", \"am I overexposed to any sector\", or name a symbol directly.";
  }

  if (/help|what can you (do|ask)/.test(lower)) {
    return "I can tell you: your watchlist summary, which stocks currently need attention, sector concentration across your holdings, which stocks are at a 52-week high or low, or the attention score for any specific symbol.";
  }

  const mentionedSymbol = DEMO_SYMBOLS.find((s) => lower.includes(s.toLowerCase()));
  if (mentionedSymbol) {
    const r: any = await getAttentionScore(mentionedSymbol);
    if (r.error) return r.error;
    const flag = r.is52wHigh ? " It's at a 52-week high." : r.is52wLow ? " It's at a 52-week low." : "";
    return `${r.symbol}: attention score ${r.attentionScore}, ${r.changePct >= 0 ? "+" : ""}${r.changePct}% today${r.stale ? " (delayed data)" : ""}.${flag}`;
  }

  if (/summary|overview|how am i doing|how('s| is) my (watchlist|portfolio)/.test(lower)) {
    const s = await getWatchlistSummary(watchlistId);
    return `${s.totalStocks} stocks tracked. Holding: ${s.holdings.join(", ") || "none"}. Watching: ${s.watching.join(", ") || "none"}. Average attention ${s.averageAttention}. Needs attention: ${s.needingAttention.join(", ") || "none"}.`;
  }

  if (/sector|exposure|concentrat|overweight|diversif/.test(lower)) {
    const exposure = await getSectorExposure(watchlistId);
    if (exposure.length === 0) return "You don't have any holdings marked yet, so there's no exposure to measure.";
    const top = exposure[0];
    return `Your holdings break down as: ${exposure.map((e) => `${e.sector} ${e.pct}% (${e.symbols.join(", ")})`).join("; ")}. ${top.pct >= 60 ? `That's fairly concentrated in ${top.sector}.` : "That's a reasonably spread allocation."}`;
  }

  if (/52.?week|all.?time high|all.?time low/.test(lower)) {
    const direction = /low/.test(lower) ? "low" : "high";
    const symbols = await get52wExtremes(direction);
    return symbols.length
      ? `At a 52-week ${direction}: ${symbols.join(", ")}.`
      : `Nothing in your watchlist is at a 52-week ${direction} right now.`;
  }

  if (/hold(ing)?s?\b/.test(lower)) {
    const s = await getWatchlistSummary(watchlistId);
    return s.holdings.length ? `You're holding: ${s.holdings.join(", ")}.` : "You don't have any stocks marked as holdings yet.";
  }

  if (/watch(ing)?\b/.test(lower)) {
    const s = await getWatchlistSummary(watchlistId);
    return s.watching.length ? `You're watching (not holding): ${s.watching.join(", ")}.` : "Everything on your list is marked as a holding.";
  }

  // default: unusual stocks, but only as a last resort now, not the catch-all
  const unusual = await getUnusualStocks(55);
  return unusual.length
    ? `Stocks needing attention right now: ${unusual.map((u: any) => `${u.symbol} (${u.attentionScore})`).join(", ")}.`
    : "Nothing unusual right now — everything's quiet.";
}

function buildGeminiContents(history: ChatTurn[], newMessage: string) {
  const systemPrompt =
    "You answer questions about the user's stock watchlist using ONLY the provided function results. Never invent numbers or give buy/sell advice. Be brief, specific, and conversational.";

  const historyContents = history.map((turn) => ({
    role: turn.role === "user" ? "user" : "model",
    parts: [{ text: turn.text }],
  }));

  return [
    { role: "user", parts: [{ text: systemPrompt }] },
    { role: "model", parts: [{ text: "Understood — I'll answer only from function results." }] },
    ...historyContents,
    { role: "user", parts: [{ text: newMessage }] },
  ];
}

export async function chatWithWatchlist(
  message: string,
  watchlistId: string,
  history: ChatTurn[] = []
): Promise<{ text: string; source: "gemini" | "fallback" }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { text: await fallbackChat(message, watchlistId), source: "fallback" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    let contents: any[] = buildGeminiContents(history, message);

    let res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ contents, tools: TOOLS }),
      }
    );
    if (!res.ok) throw new Error(`gemini ${res.status}`);
    let json: any = await res.json();
    let candidate = json?.candidates?.[0]?.content;

    const functionCallPart = candidate?.parts?.find((p: any) => p.functionCall);
    if (functionCallPart) {
      const { name, args } = functionCallPart.functionCall;
      const result = await executeFunctionCall(name, args ?? {}, watchlistId);

      contents.push(candidate);
      contents.push({ role: "function", parts: [{ functionResponse: { name, response: result } }] });

      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ contents, tools: TOOLS }),
        }
      );
      if (!res.ok) throw new Error(`gemini ${res.status}`);
      json = await res.json();
      candidate = json?.candidates?.[0]?.content;
    }

    const text = candidate?.parts?.find((p: any) => p.text)?.text?.trim();
    if (!text) throw new Error("empty response");
    return { text, source: "gemini" };
  } catch {
    return { text: await fallbackChat(message, watchlistId), source: "fallback" };
  } finally {
    clearTimeout(timer);
  }
}