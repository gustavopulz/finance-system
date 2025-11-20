-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."BillStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."Users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Cards" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "order" INTEGER NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Bills" (
    "id" UUID NOT NULL,
    "cardId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "description" VARCHAR(255),
    "value" DECIMAL(12,2) NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "public"."BillStatus" NOT NULL DEFAULT 'PENDING',
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "dtPaid" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "responsavel" VARCHAR(150),
    "origem" VARCHAR(150),
    "parcelasTotal" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CardShares" (
    "id" UUID NOT NULL,
    "cardId" UUID NOT NULL,
    "sharedByUserId" UUID NOT NULL,
    "sharedWithUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardShares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShareTokens" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "cardId" UUID NOT NULL,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ShareTokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "public"."Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ShareTokens_token_key" ON "public"."ShareTokens"("token");

-- AddForeignKey
ALTER TABLE "public"."Cards" ADD CONSTRAINT "Cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bills" ADD CONSTRAINT "Bills_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "public"."Cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bills" ADD CONSTRAINT "Bills_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CardShares" ADD CONSTRAINT "CardShares_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "public"."Cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CardShares" ADD CONSTRAINT "CardShares_sharedByUserId_fkey" FOREIGN KEY ("sharedByUserId") REFERENCES "public"."Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CardShares" ADD CONSTRAINT "CardShares_sharedWithUserId_fkey" FOREIGN KEY ("sharedWithUserId") REFERENCES "public"."Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShareTokens" ADD CONSTRAINT "ShareTokens_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "public"."Cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShareTokens" ADD CONSTRAINT "ShareTokens_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
