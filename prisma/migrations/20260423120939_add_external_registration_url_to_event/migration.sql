-- AlterTable
ALTER TABLE "event_visibilities" ADD COLUMN     "external_registration_url" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "external_registration_url" TEXT;
