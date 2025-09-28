/*
  Warnings:

  - You are about to drop the column `dueDate` on the `Bills` table. All the data in the column will be lost.
  - Added the required column `date` to the `Bills` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Bills" DROP COLUMN "dueDate",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL;
