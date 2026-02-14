/*
  Warnings:

  - The values [parcial] on the enum `BillStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `installmentNumber` on the `BillInstance` table. All the data in the column will be lost.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BillStatus_new" AS ENUM ('pendente', 'pago', 'cancelado');
ALTER TABLE "public"."BillInstance" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "BillInstance" ALTER COLUMN "status" TYPE "BillStatus_new" USING ("status"::text::"BillStatus_new");
ALTER TYPE "BillStatus" RENAME TO "BillStatus_old";
ALTER TYPE "BillStatus_new" RENAME TO "BillStatus";
DROP TYPE "public"."BillStatus_old";
ALTER TABLE "BillInstance" ALTER COLUMN "status" SET DEFAULT 'pendente';
COMMIT;

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_billInstanceId_fkey";

-- DropIndex
DROP INDEX "BillInstance_billId_idx";

-- DropIndex
DROP INDEX "BillInstance_referenceYear_referenceMonth_status_idx";

-- DropIndex
DROP INDEX "BillInstance_status_idx";

-- AlterTable
ALTER TABLE "BillInstance" DROP COLUMN "installmentNumber",
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paidByUserId" UUID;

-- DropTable
DROP TABLE "Payment";

-- DropEnum
DROP TYPE "PaymentMethod";
