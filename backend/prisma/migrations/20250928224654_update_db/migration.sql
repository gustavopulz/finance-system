/*
  Warnings:

  - You are about to drop the column `cancelledAt` on the `Bills` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Bills` table. All the data in the column will be lost.
  - You are about to drop the column `dtPaid` on the `Bills` table. All the data in the column will be lost.
  - You are about to drop the column `installmentIndex` on the `Bills` table. All the data in the column will be lost.
  - You are about to drop the column `installmentPlanId` on the `Bills` table. All the data in the column will be lost.
  - You are about to drop the column `parcelado` on the `Bills` table. All the data in the column will be lost.
  - You are about to drop the column `period` on the `Bills` table. All the data in the column will be lost.
  - You are about to drop the column `recurrenceId` on the `Bills` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Bills` table. All the data in the column will be lost.
  - You are about to drop the `Recurrences` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `startDate` to the `Bills` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."BillType" AS ENUM ('fixed', 'one_time', 'installment');

-- DropForeignKey
ALTER TABLE "public"."Bills" DROP CONSTRAINT "Bills_recurrenceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Recurrences" DROP CONSTRAINT "Recurrences_cardId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Recurrences" DROP CONSTRAINT "Recurrences_userId_fkey";

-- DropIndex
DROP INDEX "public"."Bills_cardId_date_idx";

-- DropIndex
DROP INDEX "public"."Bills_installmentPlanId_installmentIndex_key";

-- DropIndex
DROP INDEX "public"."Bills_recurrenceId_idx";

-- DropIndex
DROP INDEX "public"."Bills_recurrenceId_period_key";

-- DropIndex
DROP INDEX "public"."Bills_status_idx";

-- AlterTable
ALTER TABLE "public"."Bills" DROP COLUMN "cancelledAt",
DROP COLUMN "date",
DROP COLUMN "dtPaid",
DROP COLUMN "installmentIndex",
DROP COLUMN "installmentPlanId",
DROP COLUMN "parcelado",
DROP COLUMN "period",
DROP COLUMN "recurrenceId",
DROP COLUMN "status",
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "type" "public"."BillType" NOT NULL DEFAULT 'one_time';

-- DropTable
DROP TABLE "public"."Recurrences";

-- CreateTable
CREATE TABLE "public"."BillOccurrences" (
    "id" UUID NOT NULL,
    "billId" UUID NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."BillStatus" NOT NULL DEFAULT 'pending',
    "paidAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillOccurrences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BillOccurrences_year_month_idx" ON "public"."BillOccurrences"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "BillOccurrences_billId_month_year_key" ON "public"."BillOccurrences"("billId", "month", "year");

-- AddForeignKey
ALTER TABLE "public"."BillOccurrences" ADD CONSTRAINT "BillOccurrences_billId_fkey" FOREIGN KEY ("billId") REFERENCES "public"."Bills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
