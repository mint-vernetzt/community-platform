-- AlterTable
ALTER TABLE "project_visibilities" ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false;
