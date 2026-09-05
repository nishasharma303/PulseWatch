import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../db/client";
import { signToken } from "../middleware/auth";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "email and password required" });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "email already registered" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, passwordHash } });
  await prisma.watchlist.create({ data: { userId: user.id, name: "My Watchlist" } });

  res.json({ token: signToken(user.id), userId: user.id });
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "invalid credentials" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "invalid credentials" });

  res.json({ token: signToken(user.id), userId: user.id });
});
