/*
  Warnings:

  - A unique constraint covering the columns `[url]` on the table `fundings` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "fundings_checksum_key";

-- AlterTable
ALTER TABLE "fundings" ADD COLUMN     "filter_vector" tsvector,
ADD COLUMN     "sourceAreas" TEXT[],
ADD COLUMN     "sourceEntities" TEXT[],
ADD COLUMN     "sourceFunders" TEXT[],
ADD COLUMN     "sourceRegions" TEXT[],
ADD COLUMN     "sourceTypes" TEXT[],
ALTER COLUMN "checksum" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "fundings_url_key" ON "fundings"("url");

-- CreateIndex
CREATE INDEX "fundings_filter_vector_idx" ON "fundings" USING GIN ("filter_vector");
