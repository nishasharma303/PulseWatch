-- CreateTable
CREATE TABLE "DigestLog" (
    "id" TEXT NOT NULL,
    "watchlistId" TEXT NOT NULL,
    "digest" TEXT NOT NULL,
    "symbols" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DigestLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DigestLog_watchlistId_createdAt_idx" ON "DigestLog"("watchlistId", "createdAt");
