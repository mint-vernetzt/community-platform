/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `areas` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `financings` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `focuses` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `formats` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `offer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `organization_types` will be added. If there are existing duplicate values, this will fail.
  - Made the column `slug` on table `areas` required. This step will fail if there are existing NULL values in that column.
  - Made the column `slug` on table `financings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `slug` on table `focuses` required. This step will fail if there are existing NULL values in that column.
  - Made the column `slug` on table `formats` required. This step will fail if there are existing NULL values in that column.
  - Made the column `slug` on table `offer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `slug` on table `organization_types` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "areas" ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "financings" ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "focuses" ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "formats" ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "offer" ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "organization_types" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "areas_slug_key" ON "areas"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "financings_slug_key" ON "financings"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "focuses_slug_key" ON "focuses"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "formats_slug_key" ON "formats"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "offer_slug_key" ON "offer"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organization_types_slug_key" ON "organization_types"("slug");
