import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { chatWithWatchlist, ChatTurn } from "../../narrator/chat";

export const chatRouter = Router();
chatRouter.use(requireAuth);

chatRouter.post("/", async (req, res) => {
  const { watchlistId, message, history } = req.body as { watchlistId: string; message: string; history?: ChatTurn[] };
  if (!watchlistId || !message) return res.status(400).json({ error: "watchlistId and message required" });
  const result = await chatWithWatchlist(message, watchlistId, history ?? []);
  res.json(result);
});