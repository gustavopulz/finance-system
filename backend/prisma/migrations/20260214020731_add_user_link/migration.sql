-- CreateTable
CREATE TABLE "UserLink" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "linkedUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "UserLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserLink_linkedUserId_idx" ON "UserLink"("linkedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "UserLink_ownerId_linkedUserId_key" ON "UserLink"("ownerId", "linkedUserId");

-- AddForeignKey
ALTER TABLE "UserLink" ADD CONSTRAINT "UserLink_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLink" ADD CONSTRAINT "UserLink_linkedUserId_fkey" FOREIGN KEY ("linkedUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
