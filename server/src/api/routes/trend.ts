import { Router } from "express";
import { prisma } from "../../db/client";
import { requireAuth } from "../middleware/auth";

export const trendRouter = Router();
trendRouter.use(requireAuth);

// Groups raw signal_events by poll tick (stored in event.meta.tickId) and
// sums contributions per tick to reconstruct how the base attention score
// moved over the last N ticks — without ever writing a redundant "history"
// table. This is the event log doing double duty.
trendRouter.get("/:symbol", async (req, res) => {
  const { symbol } = req.params;
  const events = await prisma.signalEvent.findMany({
    where: { symbol },
    orderBy: { timestamp: "asc" },
    take: 500,
  });

  const byTick = new Map<number, number>();
  for (const e of events) {
    const tickId = (e.meta as any)?.tickId;
    if (tickId === undefined) continue;
    byTick.set(tickId, (byTick.get(tickId) ?? 0) + e.contribution);
  }

  const series = [...byTick.entries()]
    .sort((a, b) => a[0] - b[0])
    .slice(-20)
    .map(([tick, total]) => ({ tick, score: Math.round(Math.min(100, total)) }));

  const direction =
    series.length >= 2
      ? series[series.length - 1].score > series[0].score
        ? "rising"
        : series[series.length - 1].score < series[0].score
        ? "falling"
        : "flat"
      : "flat";

  res.json({ series, direction });
});