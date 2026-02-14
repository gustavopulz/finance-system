-- AlterTable
ALTER TABLE "BillInstance" ADD COLUMN     "overriddenAmount" DECIMAL(14,2),
ADD COLUMN     "overriddenDueDate" TIMESTAMP(3);
