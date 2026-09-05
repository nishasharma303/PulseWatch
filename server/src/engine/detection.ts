export interface DetectionInput {
  closes: number[]; // historical daily closes, oldest -> newest, last one is "today"
  volume: number;
  avgVolume20d: number;
}

export interface DetectionOutput {
  priceReturnPct: number;
  priceZScore: number; // today's move vs stock's own rolling std-dev
  volumeRatio: number; // current volume / 20d avg
  is52wHigh: boolean;
  is52wLow: boolean;
  largestNDayMove: { n: number; pct: number };
}

function stdDev(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function dailyReturns(closes: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    out.push(((closes[i] - closes[i - 1]) / closes[i - 1]) * 100);
  }
  return out;
}

/**
 * Pure, deterministic, unit-testable. No I/O.
 */
export function detectChange(input: DetectionInput): DetectionOutput {
  const { closes, volume, avgVolume20d } = input;
  const today = closes[closes.length - 1];
  const yesterday = closes[closes.length - 2] ?? today;
  const priceReturnPct = ((today - yesterday) / yesterday) * 100;

  const returns = dailyReturns(closes.slice(0, -1)); // history excluding today, so today isn't in its own baseline
  const sigma = stdDev(returns) || 0.01; // guard divide-by-zero on flat series
  const priceZScore = priceReturnPct / sigma;

  const volumeRatio = avgVolume20d > 0 ? volume / avgVolume20d : 1;

  const windowFor52w = closes.slice(-252); // ~1 trading year, or full history if shorter
  const is52wHigh = today >= Math.max(...windowFor52w);
  const is52wLow = today <= Math.min(...windowFor52w);

  const n = Math.min(5, closes.length - 1);
  const nDayAgo = closes[closes.length - 1 - n];
  const largestNDayMove = { n, pct: ((today - nDayAgo) / nDayAgo) * 100 };

  return { priceReturnPct, priceZScore, volumeRatio, is52wHigh, is52wLow, largestNDayMove };
}
