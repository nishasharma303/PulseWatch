import { DetectionOutput } from "./detection";
import { ContextOutput } from "./context";

export type SignalType =
  | "price_anomaly"
  | "volume_anomaly"
  | "market_divergence"
  | "sector_divergence"
  | "historical_significance";

// Base weights — tuned so a genuinely unusual day (z~3, volume~3x, clear divergence) lands 80-100.
const BASE_WEIGHTS: Record<SignalType, number> = {
  price_anomaly: 22,
  volume_anomaly: 18,
  market_divergence: 16,
  sector_divergence: 16,
  historical_significance: 10,
};

export interface AttentionInput {
  detection: DetectionOutput;
  context: ContextOutput;
  isHolding: boolean;
  userMultipliers?: Partial<Record<SignalType, number>>; // from user_signal_weights, default 1.0
}

export interface AttentionBreakdownEntry {
  signalType: SignalType;
  rawValue: number;
  baseWeight: number;
  holdingMultiplier: number;
  userMultiplier: number;
  contribution: number;
}

export interface AttentionOutput {
  attentionScore: number; // clamped 0-100
  breakdown: AttentionBreakdownEntry[];
}

// Normalize raw signal magnitudes into a roughly comparable 0-1 range before weighting.
function normalize(signalType: SignalType, detection: DetectionOutput, context: ContextOutput): number {
  switch (signalType) {
    case "price_anomaly":
      return clamp01(Math.abs(detection.priceZScore) / 3.5); // z of 3.5+ -> maxed
    case "volume_anomaly":
      return clamp01((detection.volumeRatio - 1) / 3); // 4x avg volume -> maxed
    case "market_divergence":
      return clamp01(Math.abs(context.marketDivergence) / 5); // 5pp divergence -> maxed
    case "sector_divergence":
      return clamp01(Math.abs(context.sectorDivergence) / 5);
    case "historical_significance":
      return clamp01((detection.is52wHigh || detection.is52wLow ? 0.6 : 0) + Math.abs(detection.largestNDayMove.pct) / 15);
  }
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/**
 * Holding vs Watching bias: downside/volatility signals weighted UP for holdings,
 * breakout/opportunity signals weighted UP for watch-only.
 * This is a conditional multiplier on what gets surfaced — never a prediction.
 */
// Holding vs Watching bias: downside/volatility signals weighted UP for holdings,
// breakout/opportunity signals weighted UP for watch-only.
// Takes isDownside directly so it can be recomputed at read-time per user,
// independent of how the base signal was originally detected.
export function holdingMultiplier(signalType: SignalType, isHolding: boolean, isDownside: boolean): number {
  if (signalType === "price_anomaly" || signalType === "volume_anomaly") {
    if (isHolding && isDownside) return 1.3;
    if (!isHolding && !isDownside) return 1.25;
  }
  return 1.0;
}

export function computeAttention(input: AttentionInput): AttentionOutput {
  const { detection, context, isHolding, userMultipliers = {} } = input;
  const signalTypes: SignalType[] = [
    "price_anomaly",
    "volume_anomaly",
    "market_divergence",
    "sector_divergence",
    "historical_significance",
  ];

  const breakdown: AttentionBreakdownEntry[] = signalTypes.map((signalType) => {
    const rawValue = normalize(signalType, detection, context);
    const baseWeight = BASE_WEIGHTS[signalType];
    const hMult = holdingMultiplier(signalType, isHolding, detection.priceReturnPct < 0);
    const uMult = userMultipliers[signalType] ?? 1.0;
    const contribution = rawValue * baseWeight * hMult * uMult;
    return { signalType, rawValue, baseWeight, holdingMultiplier: hMult, userMultiplier: uMult, contribution };
  });

  const total = breakdown.reduce((a, b) => a + b.contribution, 0);
  const attentionScore = Math.round(clamp01(total / 100) * 100);

  return { attentionScore, breakdown };
}
