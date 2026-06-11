-- AlterTable
ALTER TABLE "event_visibilities" ADD COLUMN     "parent_participation_required" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "parent_participation_required" BOOLEAN;
