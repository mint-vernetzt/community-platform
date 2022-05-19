/*
  Warnings:

  - You are about to drop the column `test` on the `offers_on_profiles` table. All the data in the column will be lost.
  - You are about to drop the `offer` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "offer" DROP CONSTRAINT "offer_profileId_fkey";

-- DropForeignKey
ALTER TABLE "offers_on_profiles" DROP CONSTRAINT "offers_on_profiles_offerId_fkey";

-- DropForeignKey
ALTER TABLE "seekings_on_profiles" DROP CONSTRAINT "seekings_on_profiles_offerId_fkey";

-- AlterTable
ALTER TABLE "offers_on_profiles" DROP COLUMN "test";

-- DropTable
DROP TABLE "offer";

-- CreateTable
CREATE TABLE "offers" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "offers_title_key" ON "offers"("title");

-- AddForeignKey
ALTER TABLE "seekings_on_profiles" ADD CONSTRAINT "seekings_on_profiles_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers_on_profiles" ADD CONSTRAINT "offers_on_profiles_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
