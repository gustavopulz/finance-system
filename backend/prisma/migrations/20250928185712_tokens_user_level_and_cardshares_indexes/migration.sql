/*
  Warnings:

  - You are about to drop the column `month` on the `Bills` table. All the data in the column will be lost.
  - You are about to drop the column `origem` on the `Bills` table. All the data in the column will be lost.
  - You are about to drop the column `parcelasTotal` on the `Bills` table. All the data in the column will be lost.
  - You are about to drop the column `responsavel` on the `Bills` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `Bills` table. All the data in the column will be lost.
  - You are about to drop the column `cardId` on the `ShareTokens` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `ShareTokens` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[sharedByUserId,sharedWithUserId,cardId]` on the table `CardShares` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dueDate` to the `Bills` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `ShareTokens` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."ShareTokens" DROP CONSTRAINT "ShareTokens_cardId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ShareTokens" DROP CONSTRAINT "ShareTokens_createdBy_fkey";

-- AlterTable
ALTER TABLE "public"."Bills" DROP COLUMN "month",
DROP COLUMN "origem",
DROP COLUMN "parcelasTotal",
DROP COLUMN "responsavel",
DROP COLUMN "year",
ADD COLUMN     "category" VARCHAR(100),
ADD COLUMN     "dueDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "parcelado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parcelasNum" INTEGER;

-- AlterTable
ALTER TABLE "public"."ShareTokens" DROP COLUMN "cardId",
DROP COLUMN "createdBy",
ADD COLUMN     "claimedAt" TIMESTAMP(3),
ADD COLUMN     "claimedByUserId" UUID,
ADD COLUMN     "userId" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "CardShares_sharedWithUserId_idx" ON "public"."CardShares"("sharedWithUserId");

-- CreateIndex
CREATE INDEX "CardShares_sharedByUserId_idx" ON "public"."CardShares"("sharedByUserId");

-- CreateIndex
CREATE INDEX "CardShares_cardId_idx" ON "public"."CardShares"("cardId");

-- CreateIndex
CREATE UNIQUE INDEX "CardShares_sharedByUserId_sharedWithUserId_cardId_key" ON "public"."CardShares"("sharedByUserId", "sharedWithUserId", "cardId");

-- CreateIndex
CREATE INDEX "ShareTokens_userId_idx" ON "public"."ShareTokens"("userId");

-- CreateIndex
CREATE INDEX "ShareTokens_claimedByUserId_idx" ON "public"."ShareTokens"("claimedByUserId");

-- AddForeignKey
ALTER TABLE "public"."ShareTokens" ADD CONSTRAINT "ShareTokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShareTokens" ADD CONSTRAINT "ShareTokens_claimedByUserId_fkey" FOREIGN KEY ("claimedByUserId") REFERENCES "public"."Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
