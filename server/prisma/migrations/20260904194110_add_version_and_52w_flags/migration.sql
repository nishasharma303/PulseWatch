-- AlterTable
ALTER TABLE "StockSnapshot" ADD COLUMN     "is52wHigh" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is52wLow" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "WatchlistStock" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;
