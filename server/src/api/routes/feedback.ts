import { Router } from "express";
import { prisma } from "../../db/client";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { SignalType } from "../../engine/attention";

export const feedbackRouter = Router();
feedbackRouter.use(requireAuth);

const NUDGE_UP = 1.08;
const NUDGE_DOWN = 0.94;
const MIN_MULT = 0.4;
const MAX_MULT = 2.0;

// action: "open" (opened Understand panel -> engagement) | "dismiss" (dismissed alert)
feedbackRouter.post("/", async (req: AuthedRequest, res) => {
  const { signalType, action } = req.body as { signalType: SignalType; action: "open" | "dismiss" };
  if (!signalType || !action) return res.status(400).json({ error: "signalType and action required" });

  const existing = await prisma.userSignalWeight.findUnique({
    where: { userId_signalType: { userId: req.userId!, signalType } },
  });
  const current = existing?.multiplier ?? 1.0;
  const nudged = action === "open" ? current * NUDGE_UP : current * NUDGE_DOWN;
  const clamped = Math.max(MIN_MULT, Math.min(MAX_MULT, nudged));

  const updated = await prisma.userSignalWeight.upsert({
    where: { userId_signalType: { userId: req.userId!, signalType } },
    update: { multiplier: clamped },
    create: { userId: req.userId!, signalType, multiplier: clamped },
  });

  res.json(updated);
});

feedbackRouter.get("/weights", async (req: AuthedRequest, res) => {
  const weights = await prisma.userSignalWeight.findMany({ where: { userId: req.userId } });
  res.json(weights);
});
