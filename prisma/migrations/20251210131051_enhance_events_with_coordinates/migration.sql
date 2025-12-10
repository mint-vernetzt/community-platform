-- AlterTable
ALTER TABLE "event_visibilities" ADD COLUMN     "venue_latitude" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "venue_longitude" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "venue_latitude" TEXT,
ADD COLUMN     "venue_longitude" TEXT;
