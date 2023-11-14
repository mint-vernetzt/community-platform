-- AlterTable
ALTER TABLE "project_visibilities" ADD COLUMN     "further_job_fillings" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "further_job_fillings" TEXT;
