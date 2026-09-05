export interface NarratorInput {
  symbol: string;
  priceChangePct: number;
  vsOwnTypicalMoveX: number; // e.g. 3.2 means 3.2x its usual daily move
  vsNiftyPct: number;
  vsSectorPct: number;
  volumeRatio: number;
  held: boolean;
}

/**
 * Deterministic, template-based sentence built from the SAME structured JSON
 * the Gemini call receives. This runs whenever the AI call fails or times out,
 * so the product never breaks or shows an error because of the AI dependency.
 */
export function buildFallbackNarration(input: NarratorInput): string {
  const direction = input.priceChangePct >= 0 ? "up" : "down";
  const magnitude = Math.abs(input.priceChangePct).toFixed(1);
  const moveDescriptor =
    input.vsOwnTypicalMoveX >= 2.5 ? "a significantly larger move than usual" : "a somewhat larger move than usual";

  const marketPart =
    Math.abs(input.vsNiftyPct) >= 1
      ? `, outpacing the broader market by ${Math.abs(input.vsNiftyPct).toFixed(1)} points`
      : "";
  const sectorPart =
    Math.abs(input.vsSectorPct) >= 1
      ? `, and diverging from its sector by ${Math.abs(input.vsSectorPct).toFixed(1)} points`
      : "";
  const volumePart =
    input.volumeRatio >= 2
      ? ` Volume is running at ${input.volumeRatio.toFixed(1)}x its 20-day average, so this isn't a thin move.`
      : "";
  const heldPart = input.held ? " You're holding this one." : "";

  return `${input.symbol} is ${direction} ${magnitude}% today, ${moveDescriptor}${marketPart}${sectorPart}.${volumePart}${heldPart}`;
}
