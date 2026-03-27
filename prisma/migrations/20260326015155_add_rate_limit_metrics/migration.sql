/*
  Warnings:

  - You are about to alter the column `amount` on the `Prediction` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,8)` to `Decimal(18,8)`.
  - You are about to alter the column `payout` on the `Prediction` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,8)` to `Decimal(18,8)`.
  - You are about to alter the column `startPrice` on the `Round` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,8)` to `Decimal(18,8)`.
  - You are about to alter the column `endPrice` on the `Round` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,8)` to `Decimal(18,8)`.
  - You are about to alter the column `poolUp` on the `Round` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,8)` to `Decimal(18,8)`.
  - You are about to alter the column `poolDown` on the `Round` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,8)` to `Decimal(18,8)`.

*/
-- AlterTable
ALTER TABLE "Prediction" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(18,8),
ALTER COLUMN "payout" SET DATA TYPE DECIMAL(18,8);

-- AlterTable
ALTER TABLE "Round" ALTER COLUMN "startPrice" SET DATA TYPE DECIMAL(18,8),
ALTER COLUMN "endPrice" SET DATA TYPE DECIMAL(18,8),
ALTER COLUMN "poolUp" SET DATA TYPE DECIMAL(18,8),
ALTER COLUMN "poolDown" SET DATA TYPE DECIMAL(18,8);

-- CreateTable
CREATE TABLE "RateLimitMetric" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "ip" TEXT,
    "userId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RateLimitMetric_endpoint_idx" ON "RateLimitMetric"("endpoint");

-- CreateIndex
CREATE INDEX "RateLimitMetric_timestamp_idx" ON "RateLimitMetric"("timestamp");

-- CreateIndex
CREATE INDEX "RateLimitMetric_key_idx" ON "RateLimitMetric"("key");
