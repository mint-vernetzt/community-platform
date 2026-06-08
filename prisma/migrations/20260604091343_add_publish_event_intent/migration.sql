-- AlterTable
ALTER TABLE "event_visibilities" ADD COLUMN     "publish_intended" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "publish_intended" BOOLEAN NOT NULL DEFAULT false;
