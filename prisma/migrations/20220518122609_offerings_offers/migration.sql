/*
  Warnings:

  - You are about to drop the column `offerings` on the `profiles` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "OfferType" AS ENUM ('OFFERING', 'SEEKING');

-- AlterTable
ALTER TABLE "offer" ADD COLUMN     "profileId" TEXT;

-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "offerings";

-- CreateTable
CREATE TABLE "offers_on_profiles" (
    "profileId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "offerType" "OfferType" NOT NULL,

    CONSTRAINT "offers_on_profiles_pkey" PRIMARY KEY ("profileId","offerId")
);

-- AddForeignKey
ALTER TABLE "offers_on_profiles" ADD CONSTRAINT "offers_on_profiles_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers_on_profiles" ADD CONSTRAINT "offers_on_profiles_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer" ADD CONSTRAINT "offer_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
