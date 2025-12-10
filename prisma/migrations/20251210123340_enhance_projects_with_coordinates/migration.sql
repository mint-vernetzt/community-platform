-- AlterTable
ALTER TABLE "project_visibilities" ADD COLUMN     "latitude" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "longitude" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "latitude" TEXT,
ADD COLUMN     "longitude" TEXT;
