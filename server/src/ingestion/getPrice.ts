import { generateSeries, generateNiftySeries, DailyBar } from "./seedData";

export interface PriceResult {
  symbol: string;
  price: number;
  prevClose: number;
  volume: number;
  avgVolume20d: number;
  stale: boolean;
  source: "live" | "seeded";
  fetchedAt: string;
}

// In-memory cache used by the circuit breaker for last-known-good values.
const lastKnownGood = new Map<string, PriceResult>();

// --- Circuit breaker state, per symbol ---
type BreakerState = "closed" | "open" | "half-open";
interface Breaker {
  state: BreakerState;
  failureCount: number;
  openedAt: number;
}
const breakers = new Map<string, Breaker>();
const FAILURE_THRESHOLD = 3;
const OPEN_COOLDOWN_MS = 30_000;

function getBreaker(symbol: string): Breaker {
  if (!breakers.has(symbol)) breakers.set(symbol, { state: "closed", failureCount: 0, openedAt: 0 });
  return breakers.get(symbol)!;
}

function recordSuccess(symbol: string) {
  const b = getBreaker(symbol);
  b.state = "closed";
  b.failureCount = 0;
}

function recordFailure(symbol: string) {
  const b = getBreaker(symbol);
  b.failureCount += 1;
  if (b.failureCount >= FAILURE_THRESHOLD) {
    b.state = "open";
    b.openedAt = Date.now();
  }
}

function canAttemptLive(symbol: string): boolean {
  const b = getBreaker(symbol);
  if (b.state === "closed") return true;
  if (b.state === "open" && Date.now() - b.openedAt > OPEN_COOLDOWN_MS) {
    b.state = "half-open";
    return true;
  }
  return b.state === "half-open";
}

const DATA_SOURCE = (process.env.PRICE_SOURCE ?? "seeded") as "live" | "seeded";
const LIVE_TIMEOUT_MS = 4000;

async function fetchLive(symbol: string): Promise<PriceResult> {
  // Unofficial Yahoo-Finance-backed NSE/BSE lookup. Wrapped so this file is
  // the ONLY place that knows or cares which upstream is used.
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), LIVE_TIMEOUT_MS);
  try {
    const yahooSymbol = `${symbol}.NS`;
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1mo`,
      { signal: controller.signal }
    );
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    const json: any = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) throw new Error("no chart result");
    const closes: number[] = result.indicators.quote[0].close.filter((c: number | null) => c != null);
    const volumes: number[] = result.indicators.quote[0].volume.filter((v: number | null) => v != null);
    const price = closes[closes.length - 1];
    const prevClose = closes[closes.length - 2] ?? price;
    const volume = volumes[volumes.length - 1] ?? 0;
    const avgVolume20d = volumes.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, volumes.length);

    const out: PriceResult = {
      symbol,
      price,
      prevClose,
      volume,
      avgVolume20d,
      stale: false,
      source: "live",
      fetchedAt: new Date().toISOString(),
    };
    lastKnownGood.set(symbol, out);
    recordSuccess(symbol);
    return out;
  } finally {
    clearTimeout(t);
  }
}

function fromSeeded(symbol: string, tickId?: number): PriceResult {
  const bars: DailyBar[] = generateSeries(symbol, tickId);
  const last = bars[bars.length - 1];
  const prev = bars[bars.length - 2] ?? last;
  const last20 = bars.slice(-20);
  const avgVolume20d = last20.reduce((a, b) => a + b.volume, 0) / last20.length;

  const out: PriceResult = {
    symbol,
    price: last.close,
    prevClose: prev.close,
    volume: last.volume,
    avgVolume20d,
    stale: false,
    source: "seeded",
    fetchedAt: new Date().toISOString(),
  };
  lastKnownGood.set(symbol, out);
  return out;
}

export async function getPrice(symbol: string, tickId?: number): Promise<PriceResult> {
  if (DATA_SOURCE === "seeded") {
    return fromSeeded(symbol, tickId);
  }

  if (!canAttemptLive(symbol)) {
    return staleFallback(symbol);
  }

  try {
    return await fetchLive(symbol);
  } catch {
    recordFailure(symbol);
    return staleFallback(symbol);
  }
}

function staleFallback(symbol: string): PriceResult {
  const cached = lastKnownGood.get(symbol);
  if (cached) {
    return { ...cached, stale: true, fetchedAt: new Date().toISOString() };
  }
  // no cache at all yet — fall back to seeded so the app never shows a blank
  const seeded = fromSeeded(symbol);
  return { ...seeded, stale: true };
}

export function getNiftyReturn(): number {
  const bars = generateNiftySeries();
  const last = bars[bars.length - 1];
  const prev = bars[bars.length - 2];
  return ((last.close - prev.close) / prev.close) * 100;
}

export function getHistoricalCloses(symbol: string, tickId?: number): number[] {
  return generateSeries(symbol, tickId).map((b) => b.close);
}

export interface BreakerSnapshot {
  symbol: string;
  state: BreakerState;
  failureCount: number;
}

export function getBreakerStates(): BreakerSnapshot[] {
  return [...breakers.entries()].map(([symbol, b]) => ({
    symbol,
    state: b.state,
    failureCount: b.failureCount,
  }));
}

export function getCurrentSource(): "live" | "seeded" {
  return DATA_SOURCE;
}
