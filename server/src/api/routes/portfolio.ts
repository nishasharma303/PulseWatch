import { Router } from "express";
import { prisma } from "../../db/client";
import { requireAuth } from "../middleware/auth";
import { SECTOR_MAP } from "../../ingestion/seedData";

export const portfolioRouter = Router();
portfolioRouter.use(requireAuth);

// Sector concentration — count-based (we don't track position size/value,
// so this measures "how many of your holdings share a sector," which is
// still a real, honest risk signal: correlated stocks move together
// regardless of position size.
portfolioRouter.get("/exposure/:watchlistId", async (req, res) => {
  const { watchlistId } = req.params;
  const stocks = await prisma.watchlistStock.findMany({ where: { watchlistId, isHolding: true } });

  if (stocks.length === 0) {
    return res.json({ totalHoldings: 0, sectors: [], mostConcentratedSector: null, concentrationPct: 0 });
  }

  const symbols = stocks.map((s: any) => s.symbol);
  const snapshots = await prisma.stockSnapshot.findMany({ where: { symbol: { in: symbols } } });
  const scoreBySymbol = Object.fromEntries(snapshots.map((s: any) => [s.symbol, s.attentionScore]));

  const bySector: Record<string, { symbols: string[]; avgAttention: number }> = {};
  for (const symbol of symbols) {
    const sector = SECTOR_MAP[symbol] ?? "other";
    if (!bySector[sector]) bySector[sector] = { symbols: [], avgAttention: 0 };
    bySector[sector].symbols.push(symbol);
  }
  for (const sector of Object.keys(bySector)) {
    const scores = bySector[sector].symbols.map((s) => scoreBySymbol[s] ?? 0);
    bySector[sector].avgAttention = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  const sectors = Object.entries(bySector)
    .map(([sector, data]) => ({
      sector,
      count: data.symbols.length,
      symbols: data.symbols,
      pct: Math.round((data.symbols.length / symbols.length) * 100),
      avgAttention: data.avgAttention,
    }))
    .sort((a, b) => b.pct - a.pct);

  res.json({
    totalHoldings: symbols.length,
    sectors,
    mostConcentratedSector: sectors[0]?.sector ?? null,
    concentrationPct: sectors[0]?.pct ?? 0,
  });
});

// Correlation clusters — flags when 2+ stocks in the SAME sector are
// unusual AT THE SAME TIME. This is the actual "beyond the brief" insight:
// three isolated alerts read as noise; the same three flagged as one
// correlated sector move reads as a story.
portfolioRouter.get("/clusters/:watchlistId", async (req, res) => {
  const { watchlistId } = req.params;
  const stocks = await prisma.watchlistStock.findMany({ where: { watchlistId } });
  const symbols = stocks.map((s: any) => s.symbol);
  const snapshots = await prisma.stockSnapshot.findMany({ where: { symbol: { in: symbols } } });

  const bySector: Record<string, typeof snapshots> = {};
  for (const s of snapshots) {
    const sector = SECTOR_MAP[s.symbol] ?? "other";
    if (!bySector[sector]) bySector[sector] = [];
    bySector[sector].push(s);
  }

  const CLUSTER_THRESHOLD = 45;
  const clusters = Object.entries(bySector)
    .map(([sector, members]) => {
      const active = members.filter((m: any) => m.attentionScore >= CLUSTER_THRESHOLD);
      if (active.length < 2) return null;
      const avgScore = Math.round(active.reduce((a: number, m: any) => a + m.attentionScore, 0) / active.length);
      const allUp = active.every((m: any) => m.price >= m.prevClose);
      const allDown = active.every((m: any) => m.price < m.prevClose);
      return {
        sector,
        symbols: active.map((m: any) => m.symbol),
        avgScore,
        direction: allUp ? "up" : allDown ? "down" : "mixed",
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.avgScore - a.avgScore);

  res.json({ clusters });
});