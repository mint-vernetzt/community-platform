-- AlterTable
ALTER TABLE "event_visibilities" ADD COLUMN     "move_up_to_participants" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "move_up_to_participants" BOOLEAN NOT NULL DEFAULT true;
