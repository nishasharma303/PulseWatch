import cron from "node-cron";
import { prisma } from "../db/client";
import { getPrice, getNiftyReturn, getHistoricalCloses } from "./getPrice";
import { SECTOR_MAP, DEMO_SYMBOLS } from "./seedData";
import { detectChange } from "../engine/detection";
import { computeContext, computeSectorReturn } from "../engine/context";
import { computeAttention } from "../engine/attention";
import { broadcastSnapshotUpdate } from "../ws/hub";

let currentTickId = 0;

interface TickMetrics {
  tickId: number;
  durationMs: number;
  symbolsProcessed: number;
  sharedComputeMs: number; // sector averages + NIFTY return — computed ONCE per tick
  perSymbolComputeMs: number; // detection + context + attention — scales with symbol count
  timestamp: string;
}
let lastTickMetrics: TickMetrics | null = null;

export function getLastTickMetrics(): TickMetrics | null {
  return lastTickMetrics;
}

export async function runPollTick() {
  const tickStart = Date.now();
  currentTickId += 1;
  const tickId = currentTickId;

  // --- Shared compute tier: once per tick, regardless of how many users are watching ---
  const sharedStart = Date.now();
  const niftyReturnPct = getNiftyReturn();
  const perStockReturn: Record<string, number> = {};
  const priceCache: Record<string, Awaited<ReturnType<typeof getPrice>>> = {};

    for (const symbol of DEMO_SYMBOLS) {
    const p = await getPrice(symbol, tickId);
    priceCache[symbol] = p;
    perStockReturn[symbol] = ((p.price - p.prevClose) / p.prevClose) * 100;
  }

  const sectorReturns: Record<string, number> = {};
  for (const sector of new Set(Object.values(SECTOR_MAP))) {
    const members = DEMO_SYMBOLS.filter((s) => SECTOR_MAP[s] === sector);
    sectorReturns[sector] = computeSectorReturn(members.map((m) => perStockReturn[m]));
  }
  const sharedComputeMs = Date.now() - sharedStart;

  // --- Per-symbol compute tier: scales with stock count, not user count ---
  const perSymbolStart = Date.now();
  for (const symbol of DEMO_SYMBOLS) {
    const price = priceCache[symbol];
    const closes = getHistoricalCloses(symbol, tickId);
    const detection = detectChange({ closes, volume: price.volume, avgVolume20d: price.avgVolume20d });
    const context = computeContext({
      stockReturnPct: perStockReturn[symbol],
      niftyReturnPct,
      sectorReturnPct: sectorReturns[SECTOR_MAP[symbol]],
    });

    const { attentionScore, breakdown } = computeAttention({ detection, context, isHolding: false });

    for (const entry of breakdown) {
      const dedupeKey = `${symbol}:${entry.signalType}:${tickId}`;
      await prisma.signalEvent
        .upsert({
          where: { dedupeKey },
          update: {},
          create: {
            symbol,
            signalType: entry.signalType,
            value: entry.rawValue,
            contribution: entry.contribution,
            dedupeKey,
            meta: { tickId },
          },
        })
        .catch(() => {});
    }

    await prisma.stockSnapshot.upsert({
      where: { symbol },
      update: {
        price: price.price,
        prevClose: price.prevClose,
        volume: price.volume,
        attentionScore,
        breakdown: breakdown as any,
        is52wHigh: detection.is52wHigh,
        is52wLow: detection.is52wLow,
        stale: price.stale,
        source: price.source,
      },
      create: {
        symbol,
        price: price.price,
        prevClose: price.prevClose,
        volume: price.volume,
        attentionScore,
        breakdown: breakdown as any,
        is52wHigh: detection.is52wHigh,
        is52wLow: detection.is52wLow,
        stale: price.stale,
        source: price.source,
      },
    });
  }
  const perSymbolComputeMs = Date.now() - perSymbolStart;
  const durationMs = Date.now() - tickStart;

  lastTickMetrics = {
    tickId,
    durationMs,
    symbolsProcessed: DEMO_SYMBOLS.length,
    sharedComputeMs,
    perSymbolComputeMs,
    timestamp: new Date().toISOString(),
  };

  // Push to every connected client — this is what makes "return later and see
  // what changed" actually live instead of only true on next poll/refresh.
  broadcastSnapshotUpdate({ tickId, durationMs, symbolsProcessed: DEMO_SYMBOLS.length });

  return { tickId, symbolsProcessed: DEMO_SYMBOLS.length, durationMs };
}

export function startPoller() {
  const schedule = process.env.POLL_CRON ?? "*/30 * * * * *";
  cron.schedule(schedule, () => {
    runPollTick().catch((err) => console.error("[poller] tick failed", err));
  });
  runPollTick().catch((err) => console.error("[poller] initial tick failed", err));
}