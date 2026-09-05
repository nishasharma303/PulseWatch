export interface ContextInput {
  stockReturnPct: number;
  niftyReturnPct: number;
  sectorReturnPct: number;
}

export interface ContextOutput {
  marketDivergence: number; // stock return - NIFTY return
  sectorDivergence: number; // stock return - sector avg return
}

export function computeContext(input: ContextInput): ContextOutput {
  return {
    marketDivergence: input.stockReturnPct - input.niftyReturnPct,
    sectorDivergence: input.stockReturnPct - input.sectorReturnPct,
  };
}

/**
 * Sector average return = simple mean of member stocks' daily return.
 * Computed once per sector per tick, shared across every stock in it
 * (this is the "stock-level, shared across users" compute tier).
 */
export function computeSectorReturn(memberReturnsPct: number[]): number {
  if (memberReturnsPct.length === 0) return 0;
  return memberReturnsPct.reduce((a, b) => a + b, 0) / memberReturnsPct.length;
}
