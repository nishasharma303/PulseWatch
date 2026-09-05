import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { generateSeries, generateNiftySeries } from "../../ingestion/seedData";

export const historyRouter = Router();
historyRouter.use(requireAuth);

const RANGE_DAYS: Record<string, number> = { "1D": 2, "1W": 7, "1M": 30, "1Y": 60 };

historyRouter.get("/market/nifty", (req, res) => {
  const range = (req.query.range as string) ?? "1M";
  const days = RANGE_DAYS[range] ?? 30;
  const bars = generateNiftySeries().slice(-days);
  res.json(bars.map((b) => ({ date: b.date, close: b.close })));
});

historyRouter.get("/:symbol", (req, res) => {
  const { symbol } = req.params;
  const range = (req.query.range as string) ?? "1M";
  const days = RANGE_DAYS[range] ?? 30;
  const bars = generateSeries(symbol).slice(-days);
  res.json(bars.map((b) => ({ date: b.date, close: b.close })));
});