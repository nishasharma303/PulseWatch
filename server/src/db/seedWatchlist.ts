// Run with: npx tsx src/db/seedWatchlist.ts <email> <password>
// Registers a demo user (if needed) and adds all demo symbols to their watchlist,
// marking 2 as holdings, so the dashboard isn't empty on first login.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "./client";
import { DEMO_SYMBOLS } from "../ingestion/seedData";

async function main() {
  const email = process.argv[2] ?? "demo@pulsewatch.dev";
  const password = process.argv[3] ?? "demo1234";

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const passwordHash = await bcrypt.hash(password, 10);
    user = await prisma.user.create({ data: { email, passwordHash } });
    console.log(`created user ${email} / ${password}`);
  }

  let watchlist = await prisma.watchlist.findFirst({ where: { userId: user.id } });
  if (!watchlist) {
    watchlist = await prisma.watchlist.create({ data: { userId: user.id, name: "My Watchlist" } });
  }

  for (const [i, symbol] of DEMO_SYMBOLS.entries()) {
    await prisma.watchlistStock.upsert({
      where: { watchlistId_symbol: { watchlistId: watchlist.id, symbol } },
      update: {},
      create: { watchlistId: watchlist.id, symbol, isHolding: i < 2 },
    });
  }

  console.log(`watchlist ${watchlist.id} seeded with ${DEMO_SYMBOLS.length} symbols`);
}

main().finally(() => prisma.$disconnect());
