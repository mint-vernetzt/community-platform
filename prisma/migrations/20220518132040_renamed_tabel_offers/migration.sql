/*
  Warnings:

  - You are about to drop the `offers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "offers_on_profiles" DROP CONSTRAINT "offers_on_profiles_offerId_fkey";

-- DropForeignKey
ALTER TABLE "seekings_on_profiles" DROP CONSTRAINT "seekings_on_profiles_offerId_fkey";

-- DropTable
DROP TABLE "offers";

-- CreateTable
CREATE TABLE "offer" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "offer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "offer_title_key" ON "offer"("title");

-- AddForeignKey
ALTER TABLE "seekings_on_profiles" ADD CONSTRAINT "seekings_on_profiles_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers_on_profiles" ADD CONSTRAINT "offers_on_profiles_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
