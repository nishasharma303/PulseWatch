import { Router } from "express";
import { prisma } from "../../db/client";
import { requireAuth, AuthedRequest } from "../middleware/auth";

export const watchlistRouter = Router();
watchlistRouter.use(requireAuth);

watchlistRouter.get("/", async (req: AuthedRequest, res) => {
  const watchlists = await prisma.watchlist.findMany({
    where: { userId: req.userId },
    include: { stocks: true },
  });
  res.json(watchlists);
});

watchlistRouter.post("/:watchlistId/stocks", async (req: AuthedRequest, res) => {
  const { watchlistId } = req.params;
  const { symbol, isHolding } = req.body;
  const stock = await prisma.watchlistStock.upsert({
    where: { watchlistId_symbol: { watchlistId, symbol } },
    update: { isHolding: !!isHolding }, // last-write-wins on concurrent edits, by design
    create: { watchlistId, symbol, isHolding: !!isHolding },
  });
  res.json(stock);
});

watchlistRouter.patch("/:watchlistId/stocks/:symbol", async (req: AuthedRequest, res) => {
  const { watchlistId, symbol } = req.params;
  const { isHolding } = req.body;
  const stock = await prisma.watchlistStock.update({
    where: { watchlistId_symbol: { watchlistId, symbol } },
    data: { isHolding },
  });
  res.json(stock);
});

watchlistRouter.delete("/:watchlistId/stocks/:symbol", async (req: AuthedRequest, res) => {
  const { watchlistId, symbol } = req.params;
  await prisma.watchlistStock.delete({ where: { watchlistId_symbol: { watchlistId, symbol } } });
  res.status(204).send();
});
