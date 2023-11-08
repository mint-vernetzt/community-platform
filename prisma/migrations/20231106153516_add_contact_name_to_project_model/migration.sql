-- AlterTable
ALTER TABLE "project_visibilities" ADD COLUMN     "contact_name" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "contact_name" TEXT;
