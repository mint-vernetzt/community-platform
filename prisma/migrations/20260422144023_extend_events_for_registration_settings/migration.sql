-- AlterTable
ALTER TABLE "event_visibilities" ADD COLUMN     "external" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "open_for_registration" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "external" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "open_for_registration" BOOLEAN NOT NULL DEFAULT true;
