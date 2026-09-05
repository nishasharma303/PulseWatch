import { Router } from "express";
import { runPollTick, getLastTickMetrics } from "../../ingestion/poller";
import { getBreakerStates, getCurrentSource } from "../../ingestion/getPrice";
import { connectedClientCount } from "../../ws/hub";
import { DEMO_SYMBOLS } from "../../ingestion/seedData";
import { prisma } from "../../db/client";

export const devRouter = Router();

devRouter.use((_req, res, next) => {
  if (process.env.NODE_ENV === "production") return res.status(403).json({ error: "disabled in production" });
  next();
});

devRouter.post("/simulate-tick", async (_req, res) => {
  const result = await runPollTick();
  res.json(result);
});

devRouter.get("/circuit-breakers", async (_req, res) => {
  const breakers = getBreakerStates();
  const snapshots = await prisma.stockSnapshot.findMany();

  const merged = snapshots.map((s: any) => {
    const breaker = breakers.find((b) => b.symbol === s.symbol);
    return {
      symbol: s.symbol,
      breakerState: breaker?.state ?? "closed",
      failureCount: breaker?.failureCount ?? 0,
      stale: s.stale,
      source: s.source,
      lastWrite: s.writtenAt,
    };
  });

  res.json({ globalSource: getCurrentSource(), symbols: merged });
});

// Makes the "how this scales" claim concrete instead of a README paragraph.
devRouter.get("/scale-metrics", (_req, res) => {
  res.json({
    lastTick: getLastTickMetrics(),
    connectedClients: connectedClientCount(),
    totalSymbolsTracked: DEMO_SYMBOLS.length,
    note: "Shared compute (sector averages, NIFTY return) runs once per tick regardless of user count. Per-symbol compute (detection/context/attention) scales with stock count, not user count. Per-user compute (holding bias, adaptive weights) is a cheap read-time transform applied in /api/attention, not in the poller.",
  });
});