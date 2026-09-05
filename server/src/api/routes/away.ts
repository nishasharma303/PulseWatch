import { Router } from "express";
import { prisma } from "../../db/client";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { narrateDigest } from "../../narrator/narrator";

export const awayRouter = Router();
awayRouter.use(requireAuth);

awayRouter.get("/:watchlistId", async (req: AuthedRequest, res) => {
  const { watchlistId } = req.params;

  const lastSeen = await prisma.userLastSeen.findUnique({
    where: { userId_watchlistId: { userId: req.userId!, watchlistId } },
  });
  const since = lastSeen?.seenAt ?? new Date(Date.now() - 24 * 60 * 60 * 1000);

  const stocks = await prisma.watchlistStock.findMany({ where: { watchlistId } });
  const symbols = stocks.map((s: any) => s.symbol);

  const events = await prisma.signalEvent.findMany({
    where: { symbol: { in: symbols }, timestamp: { gt: since }, contribution: { gt: 8 } },
    orderBy: { timestamp: "desc" },
  });

  const bySymbol = new Map<string, typeof events>();
  for (const e of events) {
    if (!bySymbol.has(e.symbol)) bySymbol.set(e.symbol, []);
    bySymbol.get(e.symbol)!.push(e);
  }

  const summaryLines: string[] = [];
  for (const [symbol, symEvents] of bySymbol) {
    const top = symEvents.sort((a, b) => b.contribution - a.contribution)[0];
    summaryLines.push(`${symbol} showed a notable ${top.signalType.replace("_", " ")}`);
  }

  const digest = await narrateDigest(summaryLines);
  const symbolsWithActivity = [...bySymbol.keys()];

  // Persist so "Digest" becomes a real page you can scroll back through,
  // not a popup that's gone the moment you close it.
  if (events.length > 0) {
    await prisma.digestLog.create({
      data: { watchlistId, digest: digest.text, symbols: symbolsWithActivity },
    });
  }

  await prisma.userLastSeen.upsert({
    where: { userId_watchlistId: { userId: req.userId!, watchlistId } },
    update: { seenAt: new Date() },
    create: { userId: req.userId!, watchlistId, seenAt: new Date() },
  });

  res.json({
    since,
    symbolsWithActivity,
    eventCount: events.length,
    digest: digest.text,
    digestSource: digest.source,
    allCaughtUp: events.length === 0,
  });
});

awayRouter.get("/:watchlistId/history", async (req, res) => {
  const { watchlistId } = req.params;
  const logs = await prisma.digestLog.findMany({
    where: { watchlistId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  res.json(logs);
});