import { Router } from "express";
import { prisma } from "../../db/client";
import { requireAuth } from "../middleware/auth";

export const timelineRouter = Router();
timelineRouter.use(requireAuth);

// Global feed across the whole watchlist — MUST be declared before /:symbol
// or Express will try to match "watchlist" as a stock symbol.
timelineRouter.get("/watchlist/:watchlistId/feed", async (req, res) => {
  const { watchlistId } = req.params;
  const stocks = await prisma.watchlistStock.findMany({ where: { watchlistId } });
  const symbols = stocks.map((s: any) => s.symbol);

  const events = await prisma.signalEvent.findMany({
    where: { symbol: { in: symbols }, contribution: { gt: 5 } }, // only material events, not every tick's noise
    orderBy: { timestamp: "desc" },
    take: 60,
  });

  res.json(events);
});

// Renders the append-only event log for one symbol — "how did this score build up."
timelineRouter.get("/:symbol", async (req, res) => {
  const { symbol } = req.params;
  const events = await prisma.signalEvent.findMany({
    where: { symbol },
    orderBy: { timestamp: "desc" },
    take: 100,
  });
  res.json(events);
});