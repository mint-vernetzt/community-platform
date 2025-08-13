-- AlterTable
ALTER TABLE "organization_visibilities" ADD COLUMN     "latitude" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "longitude" BOOLEAN NOT NULL DEFAULT true;
