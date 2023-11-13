/*
  Warnings:

  - You are about to drop the column `bluesky` on the `project_visibilities` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "project_visibilities" DROP COLUMN "bluesky",
ADD COLUMN     "financings" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "further_financings" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "further_room_situation" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "further_technical_requirements" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "job_fillings" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "room_situation" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "technical_requirements" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tiktok" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "timeframe" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "yearly_budget" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "further_financings" TEXT,
ADD COLUMN     "further_room_situation" TEXT,
ADD COLUMN     "further_technical_requirements" TEXT,
ADD COLUMN     "job_fillings" TEXT,
ADD COLUMN     "room_situation" TEXT,
ADD COLUMN     "technical_requirements" TEXT,
ADD COLUMN     "timeframe" TEXT,
ADD COLUMN     "yearly_budget" TEXT;

-- CreateTable
CREATE TABLE "financings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "financings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financings_of_projects" (
    "financing_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financings_of_projects_pkey" PRIMARY KEY ("financing_id","project_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "financings_title_key" ON "financings"("title");

-- AddForeignKey
ALTER TABLE "financings_of_projects" ADD CONSTRAINT "financings_of_projects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financings_of_projects" ADD CONSTRAINT "financings_of_projects_financing_id_fkey" FOREIGN KEY ("financing_id") REFERENCES "financings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
