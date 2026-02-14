-- AlterTable
ALTER TABLE "Bill" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "BillInstance" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;
