import { Router } from "express";
import { prisma } from "../../db/client";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { narrate } from "../../narrator/narrator";
import { computeAttention, holdingMultiplier } from "../../engine/attention";

export const attentionRouter = Router();
attentionRouter.use(requireAuth);

// Ranked attention cards for a watchlist — applies the user-level cheap transform
// (holding bias + adaptive weights) over the shared, precomputed StockSnapshot.
attentionRouter.get("/:watchlistId", async (req: AuthedRequest, res) => {
  const { watchlistId } = req.params;
  const stocks = await prisma.watchlistStock.findMany({ where: { watchlistId } });
  const userWeights = await prisma.userSignalWeight.findMany({ where: { userId: req.userId } });
  const weightMap = Object.fromEntries(userWeights.map((w: { signalType: string; multiplier: number }) => [w.signalType, w.multiplier]));

  const cards = [];
  for (const stock of stocks) {
    const snapshot = await prisma.stockSnapshot.findUnique({ where: { symbol: stock.symbol } });
    if (!snapshot) continue;

    // Re-derive the FULL breakdown at read time — holding bias is recomputed
    // here using THIS user's actual isHolding flag, not whatever the poller
    // baked in (the poller always computes with isHolding: false, since it's
    // shared across every user watching the symbol).
    const storedBreakdown = snapshot.breakdown as any[];
    const isDownside = snapshot.price < snapshot.prevClose;
    const rebuilt = storedBreakdown.map((b) => ({
      ...b,
      holdingMultiplier: holdingMultiplier(b.signalType, stock.isHolding, isDownside),
      userMultiplier: weightMap[b.signalType] ?? 1.0,
    }));
    const total = rebuilt.reduce((a, b) => a + b.rawValue * b.baseWeight * b.holdingMultiplier * b.userMultiplier, 0);
    const attentionScore = Math.round(Math.max(0, Math.min(1, total / 100)) * 100);

    cards.push({
      symbol: stock.symbol,
      isHolding: stock.isHolding,
      version: stock.version,
      is52wHigh: snapshot.is52wHigh,
      is52wLow: snapshot.is52wLow,
      price: snapshot.price,
      prevClose: snapshot.prevClose,
      changePct: ((snapshot.price - snapshot.prevClose) / snapshot.prevClose) * 100,
      volume: snapshot.volume,
      attentionScore,
      breakdown: rebuilt,
      stale: snapshot.stale,
      source: snapshot.source,
      updatedAt: snapshot.writtenAt,
    });
  }

  cards.sort((a, b) => b.attentionScore - a.attentionScore);
  res.json(cards);
});

// On-demand narration for one stock's card, using the same computed JSON.
attentionRouter.get("/:watchlistId/:symbol/narration", async (req: AuthedRequest, res) => {
  const { symbol } = req.params;
  const snapshot = await prisma.stockSnapshot.findUnique({ where: { symbol } });
  if (!snapshot) return res.status(404).json({ error: "no snapshot" });

  const breakdown = snapshot.breakdown as any[];
  const priceEntry = breakdown.find((b) => b.signalType === "price_anomaly");
  const volEntry = breakdown.find((b) => b.signalType === "volume_anomaly");
  const marketEntry = breakdown.find((b) => b.signalType === "market_divergence");
  const sectorEntry = breakdown.find((b) => b.signalType === "sector_divergence");

  const held = req.query.held === "true";
  const result = await narrate({
    symbol,
    priceChangePct: ((snapshot.price - snapshot.prevClose) / snapshot.prevClose) * 100,
    vsOwnTypicalMoveX: priceEntry ? Math.abs(priceEntry.rawValue) * 3.5 : 0,
    vsNiftyPct: marketEntry ? marketEntry.rawValue * 5 : 0,
    vsSectorPct: sectorEntry ? sectorEntry.rawValue * 5 : 0,
    volumeRatio: volEntry ? volEntry.rawValue * 3 + 1 : 1,
    held,
  });

  res.json(result);
});
