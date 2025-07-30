/*
  Warnings:

  - You are about to drop the `areas_on_fundings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "areas_on_fundings" DROP CONSTRAINT "areas_on_fundings_area_id_fkey";

-- DropForeignKey
ALTER TABLE "areas_on_fundings" DROP CONSTRAINT "areas_on_fundings_funding_id_fkey";

-- DropTable
DROP TABLE "areas_on_fundings";

-- CreateTable
CREATE TABLE "funding_regions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "funding_regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funding_regions_on_fundings" (
    "funding_id" TEXT NOT NULL,
    "region_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "funding_regions_on_fundings_pkey" PRIMARY KEY ("funding_id","region_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "funding_regions_title_key" ON "funding_regions"("title");

-- CreateIndex
CREATE UNIQUE INDEX "funding_regions_slug_key" ON "funding_regions"("slug");

-- AddForeignKey
ALTER TABLE "funding_regions_on_fundings" ADD CONSTRAINT "funding_regions_on_fundings_funding_id_fkey" FOREIGN KEY ("funding_id") REFERENCES "fundings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funding_regions_on_fundings" ADD CONSTRAINT "funding_regions_on_fundings_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "funding_regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
