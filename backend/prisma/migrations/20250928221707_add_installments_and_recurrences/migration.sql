/*
  Warnings:

  - A unique constraint covering the columns `[installmentPlanId,installmentIndex]` on the table `Bills` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[recurrenceId,period]` on the table `Bills` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Bills" ADD COLUMN     "installmentIndex" INTEGER,
ADD COLUMN     "installmentPlanId" UUID,
ADD COLUMN     "period" VARCHAR(7),
ADD COLUMN     "recurrenceId" UUID;

-- CreateTable
CREATE TABLE "public"."Recurrences" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "cardId" UUID NOT NULL,
    "description" VARCHAR(255),
    "value" DECIMAL(12,2) NOT NULL,
    "cadence" VARCHAR(20) NOT NULL,
    "dayOfMonth" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "category" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recurrences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Recurrences_userId_idx" ON "public"."Recurrences"("userId");

-- CreateIndex
CREATE INDEX "Recurrences_cardId_idx" ON "public"."Recurrences"("cardId");

-- CreateIndex
CREATE INDEX "Bills_cardId_date_idx" ON "public"."Bills"("cardId", "date");

-- CreateIndex
CREATE INDEX "Bills_status_idx" ON "public"."Bills"("status");

-- CreateIndex
CREATE INDEX "Bills_recurrenceId_idx" ON "public"."Bills"("recurrenceId");

-- CreateIndex
CREATE UNIQUE INDEX "Bills_installmentPlanId_installmentIndex_key" ON "public"."Bills"("installmentPlanId", "installmentIndex");

-- CreateIndex
CREATE UNIQUE INDEX "Bills_recurrenceId_period_key" ON "public"."Bills"("recurrenceId", "period");

-- AddForeignKey
ALTER TABLE "public"."Bills" ADD CONSTRAINT "Bills_recurrenceId_fkey" FOREIGN KEY ("recurrenceId") REFERENCES "public"."Recurrences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Recurrences" ADD CONSTRAINT "Recurrences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Recurrences" ADD CONSTRAINT "Recurrences_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "public"."Cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
