/*
  Warnings:

  - You are about to drop the column `offerType` on the `offers_on_profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "offers_on_profiles" DROP COLUMN "offerType";

-- DropEnum
DROP TYPE "OfferType";

-- CreateTable
CREATE TABLE "seekings_on_profiles" (
    "profileId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,

    CONSTRAINT "seekings_on_profiles_pkey" PRIMARY KEY ("profileId","offerId")
);

-- AddForeignKey
ALTER TABLE "seekings_on_profiles" ADD CONSTRAINT "seekings_on_profiles_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seekings_on_profiles" ADD CONSTRAINT "seekings_on_profiles_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
