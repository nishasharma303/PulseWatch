// Deterministic, reproducible seeded market data for 10 demo stocks across 3 sectors.
// Two stocks (RELIANCE, HDFCBANK) get an engineered "unusual day" so the
// Attention Engine has something real to score highly — not random noise.

export type Sector = "energy" | "banking" | "it";

export interface SectorMap {
  [symbol: string]: Sector;
}

export const SECTOR_MAP: SectorMap = {
  RELIANCE: "energy",
  ONGC: "energy",
  BPCL: "energy",
  HDFCBANK: "banking",
  ICICIBANK: "banking",
  SBIN: "banking",
  TCS: "it",
  INFY: "it",
  WIPRO: "it",
  HCLTECH: "it",
};

export interface DailyBar {
  date: string; // ISO date
  close: number;
  volume: number;
}

// Simple seeded PRNG so runs are reproducible across demo runs.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BASE_PRICES: Record<string, number> = {
  RELIANCE: 2950,
  ONGC: 265,
  BPCL: 310,
  HDFCBANK: 1650,
  ICICIBANK: 1180,
  SBIN: 810,
  TCS: 4150,
  INFY: 1850,
  WIPRO: 545,
  HCLTECH: 1780,
};

const BASE_VOLUME: Record<string, number> = {
  RELIANCE: 8_000_000,
  ONGC: 6_500_000,
  BPCL: 4_200_000,
  HDFCBANK: 9_500_000,
  ICICIBANK: 7_800_000,
  SBIN: 11_000_000,
  TCS: 3_100_000,
  INFY: 5_400_000,
  WIPRO: 6_900_000,
  HCLTECH: 2_800_000,
};

// Stocks + the specific past day-index (from end) engineered as "unusual"
const UNUSUAL_DAYS: Record<string, { daysAgo: number; priceShockPct: number; volumeMultiplier: number }> = {
  RELIANCE: { daysAgo: 0, priceShockPct: 4.8, volumeMultiplier: 3.4 },
  HDFCBANK: { daysAgo: 0, priceShockPct: -3.6, volumeMultiplier: 2.7 },
};

const HISTORY_DAYS = 60;

export function generateSeries(symbol: string, tickId?: number): DailyBar[] {
  const rng = mulberry32(hashSymbol(symbol));
  const bars: DailyBar[] = [];
  let price = BASE_PRICES[symbol] ?? 1000;
  const today = new Date();

  for (let i = HISTORY_DAYS - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    let dailyPct = (rng() - 0.5) * 1.6;
    let volume = BASE_VOLUME[symbol] * (0.8 + rng() * 0.4);

    const unusual = UNUSUAL_DAYS[symbol];
    if (unusual && unusual.daysAgo === i) {
      dailyPct = unusual.priceShockPct;
      volume = BASE_VOLUME[symbol] * unusual.volumeMultiplier;
    }

    // Simulated intraday movement for "today" only, driven by tickId — this
    // is what makes "Simulate next tick" actually change something instead
    // of recomputing the same calendar day over and over.
    if (i === 0 && tickId !== undefined) {
      const tickRng = mulberry32(hashSymbol(symbol) + tickId * 7919);
      const intradayJitterPct = (tickRng() - 0.5) * 1.2; // up to +/-0.6% per simulated tick
      dailyPct += intradayJitterPct;
      volume *= 0.9 + tickRng() * 0.3;
    }

    price = price * (1 + dailyPct / 100);
    bars.push({
      date: date.toISOString().slice(0, 10),
      close: Number(price.toFixed(2)),
      volume: Math.round(volume),
    });
  }

  return bars;
}

function hashSymbol(symbol: string): number {
  let h = 0;
  for (let i = 0; i < symbol.length; i++) h = (h * 31 + symbol.charCodeAt(i)) | 0;
  return h;
}

// NIFTY proxy series — average-ish market drift, low idiosyncratic noise.
export function generateNiftySeries(): DailyBar[] {
  const rng = mulberry32(999_999);
  const bars: DailyBar[] = [];
  let price = 24500;
  const today = new Date();
  for (let i = HISTORY_DAYS - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dailyPct = (rng() - 0.5) * 0.9;
    price = price * (1 + dailyPct / 100);
    bars.push({ date: date.toISOString().slice(0, 10), close: Number(price.toFixed(2)), volume: 0 });
  }
  return bars;
}

export const DEMO_SYMBOLS = Object.keys(SECTOR_MAP);
